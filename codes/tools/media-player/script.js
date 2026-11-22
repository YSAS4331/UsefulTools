const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
const formatTime = seconds => {
  if (!Number.isFinite(seconds) || seconds < 0) return "0:00";
  const value = Math.floor(seconds), hours = Math.floor(value / 3600);
  const minutes = Math.floor((value % 3600) / 60), secs = value % 60;
  return hours ? `${hours}:${String(minutes).padStart(2,"0")}:${String(secs).padStart(2,"0")}` : `${minutes}:${String(secs).padStart(2,"0")}`;
};
const formatSize = bytes => bytes < 1048576 ? `${(bytes/1024).toFixed(1)} KB` : bytes < 1073741824 ? `${(bytes/1048576).toFixed(1)} MB` : `${(bytes/1073741824).toFixed(2)} GB`;
const baseName = name => name.replace(/\.[^.]+$/,"").toLocaleLowerCase();
let cleanupActive = null;

const init = () => {
  cleanupActive?.();
  const root = $("#tool"), input = $("#upload-file");
  if (!root || !input) return;
  const audio=$("#audio-player",root), video=$("#video-player",root), artwork=$("#artwork-image",root);
  const audioVisual=$("#audio-visual",root), stageEmpty=$("#stage-empty",root), queue=$("#queue-list",root), library=$("#files",root);
  const lyricsContent=$("#lyrics-content",root), count=$(".nav-file-count",root);
  const seek=$("#seek-bar",root), playButton=$("#play-button",root), previousButton=$("#previous-button",root), nextButton=$("#next-button",root);
  const shuffleButton=$("#shuffle-button",root), repeatButton=$("#repeat-button",root), volume=$("#volume-bar",root), speed=$("#speed-select",root);
  const currentTime=$("#current-time",root), duration=$("#duration",root), trackTitle=$("#track-title",root), trackMeta=$("#track-meta",root);
  const indicator=$("#playing-indicator",root), upload=$("#upload-container",root);\n  const miniTitle=$("#mini-track-title",root),miniMeta=$("#mini-track-meta",root),miniArtwork=$("#mini-artwork-image",root),miniArtworkIcon=$("#mini-artwork-icon",root),miniPlay=$("#mini-play-button",root),miniNext=$("#mini-next-button",root);
  const iconStorage=window.spaRouter?.commonStorage, createIcons=iconStorage?.get("createIcons"), lucideIcons=iconStorage?.get("lucideIcons");
  const entries=new Map(), artworks=new Map(), lyricFiles=new Map(), listeners=[], objectUrls=new Set();
  let currentId=null,nextId=1,shuffle=false,repeat=false,seeking=false,destroyed=false,currentLyrics=[],activeLyricIndex=-1;
  const listen=(target,type,handler,options)=>{target.addEventListener(type,handler,options);listeners.push(()=>target.removeEventListener(type,handler,options));};
  const currentEntry=()=>entries.get(currentId);
  const media=()=>currentEntry()?.kind==="video"?video:audio;
  const isPlaying=()=>!audio.paused||!video.paused;
  const makeUrl=file=>{const url=URL.createObjectURL(file);objectUrls.add(url);return url;};
  const parseLrc=text=>{
    const lines=[];
    for(const raw of text.split(/\r?\n/)){
      const tags=[...raw.matchAll(/\[(\d{1,2}):(\d{2})(?:[.:](\d{1,3}))?\]/g)];
      const lyric=raw.replace(/\[[^\]]+\]/g,"").trim();
      for(const tag of tags){const time=Number(tag[1])*60+Number(tag[2])+Number((tag[3]||"0").padEnd(3,"0"))/1000;if(lyric)lines.push({time,text:lyric});}
    }
    return lines.sort((a,b)=>a.time-b.time);
  };
  const showLyrics=()=>{
    activeLyricIndex=-1;
    lyricsContent.replaceChildren();
    if(!currentLyrics.length){const p=document.createElement("p");p.className="content-empty";p.textContent="対応する .lrc ファイルがありません。音声ファイルと同じ名前の .lrc を一緒に追加してください。";lyricsContent.append(p);return;}
    currentLyrics.forEach((line,index)=>{const p=document.createElement("p");p.className="lyric-line";p.dataset.index=index;p.textContent=line.text;lyricsContent.append(p);});
  };
  const updateLyrics=()=>{
    if(!currentLyrics.length)return;
    const time=media()?.currentTime||0;
    let active=-1;
    for(let i=0;i<currentLyrics.length;i++){if(currentLyrics[i].time<=time)active=i;else break;}
    $$(".lyric-line",lyricsContent).forEach((line,index)=>line.classList.toggle("is-active",index===active));
    if(active!==activeLyricIndex){activeLyricIndex=active;const activeLine=active>=0?$(".lyric-line[data-index='"+active+"']",lyricsContent):null;activeLine?.scrollIntoView({block:"center",behavior:"smooth"});}
  };
  const updatePlaybackState=()=>{
    const playing=isPlaying();
    playButton.innerHTML=playing?'<i data-lucide="pause"></i>':'<i data-lucide="play"></i>';
    playButton.setAttribute("aria-label",playing?"一時停止":"再生");
    indicator.classList.toggle("is-playing",playing);\n    if(miniPlay){miniPlay.innerHTML=playing?"<i data-lucide=\"pause\"></i>":"<i data-lucide=\"play\"></i>";miniPlay.setAttribute("aria-label",playing?"一時停止":"再生");}
    createIcons?.({icons:lucideIcons});
  };
  const updateProgress=()=>{
    const active=media();
    if(!active||!Number.isFinite(active.duration)){currentTime.textContent=formatTime(active?.currentTime||0);duration.textContent="0:00";if(!seeking)seek.value="0";updateLyrics();return;}
    currentTime.textContent=formatTime(active.currentTime);duration.textContent=formatTime(active.duration);
    if(!seeking)seek.value=String(active.duration?active.currentTime/active.duration*1000:0);
    updateLyrics();
  };
  const renderQueue=()=>{
    queue.replaceChildren();
    if(!entries.size){const li=document.createElement("li");li.className="queue-empty";li.textContent="ファイルを追加してください";queue.append(li);}
    for(const [id,entry] of entries){
      const li=document.createElement("li");li.className="queue-item"+(id===currentId?" is-current":"");
      const select=document.createElement("button");select.type="button";select.className="queue-select";
      const icon=document.createElement("span");icon.className="file-type-icon";icon.textContent=entry.kind==="video"?"▶":"♫";
      const copy=document.createElement("span");copy.className="queue-copy";
      const name=document.createElement("strong");name.textContent=entry.file.name;
      const meta=document.createElement("small");meta.textContent=(entry.kind==="video"?"動画":"音声")+" · "+formatSize(entry.file.size);
      copy.append(name,meta);select.append(icon,copy);select.addEventListener("click",()=>selectEntry(id,true));
      const remove=document.createElement("button");remove.type="button";remove.className="remove-file";remove.textContent="×";remove.setAttribute("aria-label",entry.file.name+"を削除");remove.addEventListener("click",()=>removeEntry(id));
      li.append(select,remove);queue.append(li);
    }
    count.textContent=String(entries.size);previousButton.disabled=entries.size<2;nextButton.disabled=entries.size<2;$("#clear-queue-button",root).disabled=!entries.size;
  };
  const renderLibrary=()=>{
    library.replaceChildren();
    if(!entries.size){const li=document.createElement("li");li.className="library-empty";li.textContent="まだファイルがありません";library.append(li);return;}
    for(const [id,entry] of entries){
      const li=document.createElement("li");li.className="library-item"+(id===currentId?" is-current":"");
      const icon=document.createElement("span");icon.className="file-type-icon";icon.textContent=entry.kind==="video"?"▶":"♫";
      const copy=document.createElement("span");copy.className="library-copy";
      const name=document.createElement("strong");name.textContent=entry.file.name;
      const meta=document.createElement("small");meta.textContent=(entry.kind==="video"?"動画":"音声")+" · "+formatSize(entry.file.size);copy.append(name,meta);
      const actions=document.createElement("span");actions.className="library-actions";
      const play=document.createElement("button");play.type="button";play.className="small-action";play.textContent="再生";play.addEventListener("click",()=>{selectEntry(id,true);switchView("playlist");});
      const remove=document.createElement("button");remove.type="button";remove.className="small-action";remove.textContent="削除";remove.addEventListener("click",()=>removeEntry(id));
      actions.append(play,remove);li.append(icon,copy,actions);library.append(li);
    }
  };
  const render=()=>{renderQueue();renderLibrary();};
  const updateTrack=()=>{
    const entry=currentEntry();
    trackTitle.textContent=entry?entry.file.name.replace(/\.[^.]+$/,""):"再生待ち";
    trackMeta.textContent=entry?(entry.kind==="video"?"動画":"音声")+" · "+formatSize(entry.file.size):"ファイルが選択されていません";\n    if(miniTitle)miniTitle.textContent=entry?entry.file.name.replace(/\\.[^.]+$/, ""):"再生待ち";\n    if(miniMeta)miniMeta.textContent=entry?(entry.kind==="video"?"動画":"音声"):"ファイルが選択されていません";\n    if(miniArtwork){miniArtwork.hidden=!entry?.artworkUrl;if(entry?.artworkUrl)miniArtwork.src=entry.artworkUrl;else miniArtwork.removeAttribute("src");}\n    if(miniArtworkIcon)miniArtworkIcon.hidden=!!entry?.artworkUrl;\n    if(miniPlay)miniPlay.disabled=!entry;if(miniNext)miniNext.disabled=entries.size<2;
    stageEmpty.hidden=!!entry;audioVisual.hidden=!entry||entry.kind==="video"||!!entry.artwork;video.hidden=!entry||entry.kind!=="video";
    artwork.hidden=!entry||entry.kind!=="audio"||!entry.artwork;
    if(entry?.kind==="audio"&&entry.artwork){artwork.src=entry.artworkUrl;}else artwork.removeAttribute("src");
    seek.disabled=!entry;playButton.disabled=!entry;previousButton.disabled=entries.size<2;nextButton.disabled=entries.size<2;
    currentLyrics=entry?.lyrics||[];showLyrics();updateProgress();updatePlaybackState();render();
  };
  const play=async()=>{const active=media();if(!active||!currentEntry())return;try{await active.play();}catch(error){if(error.name!=="AbortError")console.warn("[media-player] 再生できませんでした。",error);}updatePlaybackState();};
  const pauseAll=()=>{audio.pause();video.pause();updatePlaybackState();};
  const selectEntry=(id,autoplay=false)=>{
    const entry=entries.get(id);if(!entry)return;
    pauseAll();currentId=id;audio.removeAttribute("src");video.removeAttribute("src");audio.load();video.load();
    const active=entry.kind==="video"?video:audio;active.src=entry.url;active.playbackRate=Number(speed.value);active.volume=Number(volume.value);active.load();
    updateTrack();if(autoplay)play();
  };
  const getNextId=direction=>{
    const ids=[...entries.keys()];if(!ids.length)return null;
    if(shuffle&&ids.length>1){const choices=ids.filter(id=>id!==currentId);return choices[Math.floor(Math.random()*choices.length)];}
    const index=ids.indexOf(currentId);return ids[(index+direction+ids.length)%ids.length];
  };
  const move=direction=>{const id=getNextId(direction);if(id!==null)selectEntry(id,true);};
  const onEnded=()=>{if(repeat){const active=media();active.currentTime=0;play();}else if(entries.size>1)move(1);else updatePlaybackState();};
  const removeEntry=id=>{
    const entry=entries.get(id);if(!entry)return;
    const ids=[...entries.keys()],wasCurrent=id===currentId,next=wasCurrent?ids[(ids.indexOf(id)+1)%ids.length]:null;
    if(wasCurrent){pauseAll();audio.removeAttribute("src");video.removeAttribute("src");audio.load();video.load();currentId=null;}
    entries.delete(id);for(const url of [entry.url,entry.artworkUrl])if(url){URL.revokeObjectURL(url);objectUrls.delete(url);}if(wasCurrent&&entries.size)selectEntry(next===id?entries.keys().next().value:next,false);
    if(!entries.size){currentId=null;artwork.hidden=true;artwork.removeAttribute("src");stageEmpty.hidden=false;audioVisual.hidden=false;video.hidden=true;seek.disabled=true;playButton.disabled=true;trackTitle.textContent="再生待ち";trackMeta.textContent="ファイルが選択されていません";currentLyrics=[];showLyrics();updatePlaybackState();updateProgress();}
    render();updateTrack();
  };
  const addFiles=fileList=>{
    const files=[...fileList],mediaFiles=files.filter(file=>file.type.startsWith("audio/")||file.type.startsWith("video/"));
    for(const file of files){
      const ext=file.name.split(".").pop().toLowerCase(),base=baseName(file.name);
      if(file.type.startsWith("image/"))artworks.set(base,file);
      if(ext==="lrc")lyricFiles.set(base,file);
    }
    let firstAdded=null;
    for(const file of mediaFiles){
      const id=nextId++,base=baseName(file.name),artworkFile=artworks.get(base),lyricFile=lyricFiles.get(base);
      const entry={id,file,kind:file.type.startsWith("video/")?"video":"audio",url:makeUrl(file),artwork:null,artworkUrl:null,lyrics:[]};
      if(entry.kind==="audio"&&artworkFile?.type.startsWith("image/")){entry.artwork=artworkFile;entry.artworkUrl=makeUrl(artworkFile);}
      if(entry.kind==="audio"&&lyricFile){
        const reader=new FileReader();reader.onload=()=>{if(!entries.has(id))return;entry.lyrics=parseLrc(String(reader.result||""));if(id===currentId){currentLyrics=entry.lyrics;showLyrics();updateLyrics();}};
        reader.readAsText(lyricFile);
      }
      entries.set(id,entry);if(firstAdded===null)firstAdded=id;
    }
    render();if(currentId===null&&firstAdded!==null)selectEntry(firstAdded,false);
  };
  listen(playButton,"click",()=>isPlaying()?pauseAll():play());listen(previousButton,"click",()=>move(-1));listen(nextButton,"click",()=>move(1));
  listen(shuffleButton,"click",()=>{shuffle=!shuffle;shuffleButton.classList.toggle("is-on",shuffle);shuffleButton.setAttribute("aria-pressed",String(shuffle));});
  listen(repeatButton,"click",()=>{repeat=!repeat;repeatButton.classList.toggle("is-on",repeat);repeatButton.setAttribute("aria-pressed",String(repeat));});
  listen(seek,"input",()=>{seeking=true;const active=media();if(active?.duration)currentTime.textContent=formatTime(active.duration*Number(seek.value)/1000);});
  listen(seek,"change",()=>{const active=media();if(active?.duration)active.currentTime=active.duration*Number(seek.value)/1000;seeking=false;updateProgress();});
  listen(volume,"input",()=>{audio.volume=Number(volume.value);video.volume=Number(volume.value);});
  listen(speed,"change",()=>{audio.playbackRate=Number(speed.value);video.playbackRate=Number(speed.value);});
  listen($("#clear-queue-button",root),"click",()=>{for(const id of [...entries.keys()])removeEntry(id);});
  const switchView=view=>{
    root.dataset.view=view;
    $(".content-tab[data-content-tab]",root).forEach(item=>{const active=item.dataset.contentTab===view;item.classList.toggle("is-active",active);item.setAttribute("aria-selected",String(active));});
    $(".content-panel",root).forEach(panel=>panel.hidden=panel.dataset.contentPanel!==view);
    if(view==="lyrics"){activeLyricIndex=-1;updateLyrics();}
  };
  for(const tab of $(".content-tab[data-content-tab]",root))listen(tab,"click",()=>switchView(tab.dataset.contentTab));
  listen(miniPlay,"click",()=>isPlaying()?pauseAll():play());
  listen(miniNext,"click",()=>move(1));
  switchView("player");
  for(const button of $$("[data-open-files]",root))listen(button,"click",()=>input.click());
  listen(input,"change",()=>{if(input.files?.length)addFiles(input.files);input.value="";});
  if(upload){
    const prevent=event=>{event.preventDefault();event.stopPropagation();};
    for(const type of ["dragenter","dragover","dragleave","drop"])listen(upload,type,prevent);
    for(const type of ["dragenter","dragover"])listen(upload,type,()=>upload.classList.add("dragover"));
    for(const type of ["dragleave","drop"])listen(upload,type,()=>upload.classList.remove("dragover"));
    listen(upload,"drop",event=>{const files=event.dataTransfer?.files;if(files?.length)addFiles(files);});
  }
  for(const active of [audio,video]){
    listen(active,"timeupdate",updateProgress);listen(active,"loadedmetadata",updateProgress);listen(active,"durationchange",updateProgress);
    listen(active,"play",updatePlaybackState);listen(active,"pause",updatePlaybackState);listen(active,"ended",onEnded);
    listen(active,"error",()=>{trackMeta.textContent="このファイルを再生できません。形式に対応しているか確認してください。";updatePlaybackState();});
  }
  updateTrack();
  cleanupActive=()=>{
    if(destroyed)return;destroyed=true;listeners.forEach(remove=>remove());audio.pause();video.pause();
    audio.removeAttribute("src");video.removeAttribute("src");audio.load();video.load();
    for(const url of objectUrls)URL.revokeObjectURL(url);objectUrls.clear();entries.clear();cleanupActive=null;
  };
};
const unmount=()=>cleanupActive?.();
export {init,unmount};
