#!/usr/bin/env python3
"""
Fetch Cloudflare Web Analytics data and write codes/assets/analytics.json.

Required environment variables:
    CF_API_TOKEN
    CF_ACCOUNT_ID

Optional environment variables:
    CF_ANALYTICS_HOST (default: ysas4331.pages.dev)
"""

import json
import os
import sys
from datetime import datetime, timedelta, timezone
from pathlib import Path
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen


API_URL = "https://api.cloudflare.com/client/v4/graphql"
HOST = os.getenv("CF_ANALYTICS_HOST", "ysas4331.pages.dev")
DAYS = 7
PAGE_LIMIT = 1000
TIMEOUT = 30

QUERY = """
query (
    $accountTag: String!,
    $start: Date!,
    $end: Date!,
    $host: String!,
    $pageLimit: Int!
) {
    viewer {
        accounts(filter: { accountTag: $accountTag }) {
            total: rumPageloadEventsAdaptiveGroups(
                limit: 1
                filter: {
                    date_geq: $start
                    date_leq: $end
                    requestHost: $host
                }
            ) {
                count
                sum {
                    visits
                }
                avg {
                    sampleInterval
                }
            }

            pages: rumPageloadEventsAdaptiveGroups(
                limit: $pageLimit
                orderBy: [count_DESC]
                filter: {
                    date_geq: $start
                    date_leq: $end
                    requestHost: $host
                }
            ) {
                count
                sum {
                    visits
                }
                dimensions {
                    requestPath
                }
            }

            daily: rumPageloadEventsAdaptiveGroups(
                limit: 100
                orderBy: [date_ASC]
                filter: {
                    date_geq: $start
                    date_leq: $end
                    requestHost: $host
                }
            ) {
                count
                sum {
                    visits
                }
                dimensions {
                    date
                }
            }
        }
    }
}
"""


def log(message):
    print(f"[analytics] {message}", flush=True)


def get_environment():
    token = os.getenv("CF_API_TOKEN")
    account_id = os.getenv("CF_ACCOUNT_ID")

    if not token:
        raise RuntimeError("CF_API_TOKEN が設定されていません")
    if not account_id:
        raise RuntimeError("CF_ACCOUNT_ID が設定されていません")

    return token, account_id


def fetch_analytics(token, account_id, start, end):
    variables = {
        "accountTag": account_id,
        "start": start.isoformat(),
        "end": end.isoformat(),
        "host": HOST,
        "pageLimit": PAGE_LIMIT,
    }

    payload = json.dumps({
        "query": QUERY,
        "variables": variables,
    }).encode("utf-8")

    request = Request(
        API_URL,
        data=payload,
        headers={
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json",
            "User-Agent": "UsefulTools-Analytics/1.0",
        },
        method="POST",
    )

    try:
        with urlopen(request, timeout=TIMEOUT) as response:
            result = json.loads(response.read().decode("utf-8"))
    except HTTPError as error:
        detail = error.read().decode("utf-8", errors="replace")
        raise RuntimeError(
            f"Cloudflare API HTTPエラー ({error.code}): {detail}"
        ) from error
    except (URLError, TimeoutError) as error:
        raise RuntimeError(f"Cloudflare API 接続エラー: {error}") from error
    except json.JSONDecodeError as error:
        raise RuntimeError("Cloudflare API の応答がJSONではありません") from error

    errors = result.get("errors") or []
    if errors:
        messages = [
            item.get("message", "Unknown GraphQL error")
            for item in errors
        ]
        raise RuntimeError("GraphQL エラー: " + "; ".join(messages))

    accounts = (
        result.get("data", {})
        .get("viewer", {})
        .get("accounts", [])
    )
    if not accounts:
        raise RuntimeError("Cloudflare アカウントが見つかりません")

    return accounts[0]


def build_analytics(raw, start, end):
    total_rows = raw.get("total") or []
    total = total_rows[0] if total_rows else {}

    pages = []
    for item in raw.get("pages") or []:
        dimensions = item.get("dimensions") or {}
        sums = item.get("sum") or {}
        path = dimensions.get("requestPath")

        if path:
            pages.append({
                "path": path,
                "pageviews": item.get("count", 0),
                "visits": sums.get("visits", 0),
            })

    daily = []
    for item in raw.get("daily") or []:
        dimensions = item.get("dimensions") or {}
        sums = item.get("sum") or {}
        date = dimensions.get("date")

        if date:
            daily.append({
                "date": date,
                "pageviews": item.get("count", 0),
                "visits": sums.get("visits", 0),
            })

    total_sums = total.get("sum") or {}
    total_avg = total.get("avg") or {}

    return {
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "period": {
            "start": start.isoformat(),
            "end": end.isoformat(),
            "days": DAYS,
        },
        "host": HOST,
        "summary": {
            "pageviews": total.get("count", 0),
            "visits": total_sums.get("visits", 0),
            "sample_interval": total_avg.get("sampleInterval"),
        },
        "pages": pages,
        "daily": daily,
    }


def save_analytics(data):
    root = Path(__file__).resolve().parents[2]
    output = root / "codes" / "assets" / "analytics.json"
    temporary = output.with_suffix(".json.tmp")

    output.parent.mkdir(parents=True, exist_ok=True)
    temporary.write_text(
        json.dumps(data, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )
    temporary.replace(output)

    return output


def main():
    log("Cloudflare Web Analytics を取得します")
    token, account_id = get_environment()

    today = datetime.now(timezone.utc).date()
    start = today - timedelta(days=DAYS - 1)
    end = today

    log(f"対象期間: {start} ～ {end}")
    log(f"対象ホスト: {HOST}")

    raw = fetch_analytics(token, account_id, start, end)
    data = build_analytics(raw, start, end)
    output = save_analytics(data)

    summary = data["summary"]
    log("取得完了")
    log(f"ページビュー: {summary['pageviews']}")
    log(f"訪問数: {summary['visits']}")
    log(f"ページ数: {len(data['pages'])}")
    log(f"出力先: {output}")


if __name__ == "__main__":
    try:
        main()
    except Exception as error:
        log(f"エラー: {error}")
        sys.exit(1)
