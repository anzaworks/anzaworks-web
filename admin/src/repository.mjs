import {tables,validateBackup} from './domain.mjs';
const DB='anza-works-admin',VERSION=1;
export function openDatabase(){return new Promise((resolve,reject)=>{const request=indexedDB.open(DB,VERSION);request.onupgradeneeded=()=>{const db=request.result;for(const t of tables)if(!db.objectStoreNames.contains(t))db.createObjectStore(t,{keyPath:'id'})};request.onsuccess=()=>resolve(request.result);request.onerror=()=>reject(request.error)})}
export class LocalRepository{
 constructor(db){this.db=db}
 run(table,mode,operation){if(!tables.includes(table))throw Error('Unknown collection');return new Promise((resolve,reject)=>{const tx=this.db.transaction(table,mode),req=operation(tx.objectStore(table));let result;req.onsuccess=()=>{result=req.result};tx.oncomplete=()=>resolve(result);tx.onerror=()=>reject(tx.error);tx.onabort=()=>reject(tx.error||Error('Transaction aborted'))})}
 all(table){return this.run(table,'readonly',s=>s.getAll())}
 get(table,id){return this.run(table,'readonly',s=>s.get(id))}
 async save(table,record){const now=new Date().toISOString();const value={...record,id:record.id||crypto.randomUUID(),createdAt:record.createdAt||now,updatedAt:now};await this.run(table,'readwrite',s=>s.put(value));return value}
 delete(table,id){return this.run(table,'readwrite',s=>s.delete(id))}
 async snapshot(){return Object.fromEntries(await Promise.all(tables.map(async t=>[t,await this.all(t)])))}
 async restore(backup){validateBackup(backup);await new Promise((resolve,reject)=>{const tx=this.db.transaction(tables,'readwrite');tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error);for(const t of tables){const store=tx.objectStore(t);store.clear();for(const row of backup.records[t])store.put(row)}})}
}
