import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,readdirSync} from 'node:fs';
import {emailDraftUrl,initEmailDraft} from '../build/email-draft.js';

const recipient='mailto:Ansafbisthamy@gmail.com';
test('verified contacts are interactive on Contact and in every footer',()=>{
 const contact=readFileSync('site/contact/index.html','utf8');
 assert.match(contact,/<dt>Email<\/dt><dd><a class="mail-link" href="mailto:Ansafbisthamy@gmail.com">Ansafbisthamy@gmail.com ↗/);
 assert.match(contact,/<dt>Phone<\/dt><dd><a class="mail-link" href="tel:\+94766183838">\+94 76 618 3838 ↗/);
 assert.match(contact,/<form[^>]*action="mailto:Ansafbisthamy@gmail.com" method="post" enctype="text\/plain"/);
 assert.match(contact,/<input id="name"[^>]*name="Name" required maxlength="100"/);
 assert.match(contact,/<input id="email"[^>]*type="email" required/);
 assert.match(contact,/<select id="project-type"[^>]*required/);
 assert.match(contact,/<textarea id="message"[^>]*required minlength="15" maxlength="3000"/);
 const walk=dir=>readdirSync(dir,{withFileTypes:true}).flatMap(item=>item.isDirectory()?walk(dir+'/'+item.name):item.name.endsWith('.html')?[dir+'/'+item.name]:[]);
 for(const path of walk('site')){
  const html=readFileSync(path,'utf8');
  const footer=html.match(/<footer[\s\S]*?<\/footer>/)[0];
  assert.ok(footer.includes('href="'+recipient+'"'));
  assert.ok(footer.includes('href="tel:+94766183838">+94 76 618 3838'));
  assert.doesNotMatch(html,/hello@anzaworks\.lk|api\.whatsapp/);
 }
 const css=readFileSync('site/style.css','utf8');
 assert.match(css,/\.contact-details \.mail-link\{[^}]*min-height:44px;[^}]*overflow-wrap:anywhere/);
 assert.match(css,/\.footer-grid \.footer-contact-link\{[^}]*min-height:44px;[^}]*overflow-wrap:anywhere/);
 assert.match(readFileSync('site/browser.js','utf8'),/initEmailDraft\(form/);
});

test('draft encoding preserves name, sender email, project selection and multiline Unicode message',()=>{
 const data=new FormData();
 data.append('Name','  Ansaf & Co? #1  ');data.append('Email','sender+test@example.com');
 data.append('Project type','Website');data.append('Message','Build a site & shop?\nසිංහල / தமிழ் # brief + details');data.append('Business name','');
 const url=emailDraftUrl(recipient,data);
 assert.ok(url.startsWith(recipient+'?subject='));
 const params=new URLSearchParams(url.split('?')[1]);
 assert.equal(params.get('subject'),'Anza Works project enquiry — Ansaf & Co? #1');
 assert.equal(params.get('body'),'Name: Ansaf & Co? #1\nEmail: sender+test@example.com\nProject type: Website\nMessage: Build a site & shop?\nසිංහල / தமிழ் # brief + details\nBusiness name: —');
 assert.equal([...params.keys()].length,2,'user text cannot add URI parameters');
});

test('form validation blocks invalid drafts, then opens mailto without claiming submission',()=>{
 const NativeFormData=globalThis.FormData;
 class Field extends EventTarget{constructor(value){super();this.value=value;this.error=''}setCustomValidity(error){this.error=error}}
 const name=new Field('   '),message=new Field('                ');
 const form=new EventTarget();let nativeValid=true;let checks=0;
 Object.assign(form,{querySelector:id=>id==='#name'?name:message,getAttribute:()=>recipient,reportValidity:()=>{checks++;return nativeValid&&!name.error&&!message.error}});
 const status={textContent:'Your email app will handle sending.'};const opened=[];
 globalThis.FormData=class{constructor(){const data=new NativeFormData();data.append('Name',name.value);data.append('Email','sender@example.com');data.append('Project type','Website');data.append('Message',message.value);return data}};
 try{
  const draft=initEmailDraft(form,status,url=>opened.push(url));
  const submit=()=>{const event=new Event('submit',{cancelable:true});form.dispatchEvent(event);assert.ok(event.defaultPrevented)};
  submit();assert.equal(opened.length,0);assert.ok(name.error&&message.error);
  name.value='Ansaf';message.value='A responsive portfolio website.';
  name.dispatchEvent(new Event('input'));message.dispatchEvent(new Event('input'));
  assert.equal(name.error,'');assert.equal(message.error,'');
  nativeValid=false;submit();assert.equal(opened.length,0,'native email/type validation must also pass');
  nativeValid=true;submit();assert.equal(opened.length,1);assert.ok(checks>=3);
  assert.ok(opened[0].startsWith(recipient+'?'));
  assert.match(status.textContent,/nothing was submitted/);
  assert.doesNotMatch(status.textContent,/success|message sent/i);
  draft.destroy();form.dispatchEvent(new Event('submit'));assert.equal(opened.length,1,'teardown removes handler');
 }finally{globalThis.FormData=NativeFormData}
});


test('approved WhatsApp links use the local recognizable icon, safe new tabs and restrained placement',()=>{
 const walk=dir=>readdirSync(dir,{withFileTypes:true}).flatMap(item=>item.isDirectory()?walk(dir+'/'+item.name):item.name.endsWith('.html')?[dir+'/'+item.name]:[]);
 for(const path of walk('site')){
  const html=readFileSync(path,'utf8');
  const links=[...html.matchAll(/<a[^>]*href="https:\/\/wa\.me\/[^"]+"[^>]*>[\s\S]*?<\/a>/g)].map(m=>m[0]);
  assert.equal(links.length,path==='site/contact/index.html'?2:1,path);
  for(const link of links){
   assert.match(link,/href="https:\/\/wa\.me\/94766183838"/);
   assert.match(link,/target="_blank" rel="noopener noreferrer"/);
   assert.match(link,/aria-label="Chat with Anza Works on WhatsApp"/);
   assert.match(link,/<img class="whatsapp-icon" src="\/brand\/whatsapp.svg" alt="" aria-hidden="true"/);
  }
  const footer=html.match(/<footer[\s\S]*?<\/footer>/)[0];
  assert.equal((footer.match(/wa\.me/g)||[]).length,1);
 }
 const icon=readFileSync('site/brand/whatsapp.svg','utf8');
 assert.match(icon,/viewBox="0 0 24 24"/);assert.match(icon,/<path fill="#25D366" d="M17.472/);
 const css=readFileSync('site/style.css','utf8');
 assert.match(css,/\.whatsapp-link\{[^}]*min-height:48px;max-width:100%/);
});
