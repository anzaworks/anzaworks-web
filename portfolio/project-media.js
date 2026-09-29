// Keep large project video files out of the initial page load.
for(const video of document.querySelectorAll('.project-video')){
 let loaded=false;
 const load=()=>{
  if(loaded)return;
  loaded=true;
  for(const source of video.querySelectorAll('source[data-src]')){
   source.src=source.dataset.src;
   delete source.dataset.src;
  }
  video.load();
 };
 video.addEventListener('pointerdown',load,{once:true});
 video.addEventListener('keydown',load,{once:true});
}
