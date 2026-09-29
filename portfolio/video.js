// Progressive video enhancement for future case-study media. Provide a poster and at least one source.
export function mountProjectVideo(container,{poster,sources=[],autoplayPreview=false}){
  const video=document.createElement('video');video.controls=true;video.preload='none';video.playsInline=true;video.poster=poster||'';video.className='media';video.setAttribute('aria-label','Project video');
  for(const {src,type} of sources){const source=document.createElement('source');source.src=src;source.type=type||'video/mp4';video.append(source)}
  container.append(video);
  const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
  if(autoplayPreview&&!reduced){const observer=new IntersectionObserver(entries=>{if(entries[0].isIntersecting){video.muted=true;video.loop=true;video.play().catch(()=>{});observer.disconnect()}},{rootMargin:'0px'});observer.observe(video)}
  return video;
}
