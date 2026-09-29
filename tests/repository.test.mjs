import test from 'node:test';
import assert from 'node:assert/strict';
import 'fake-indexeddb/auto';
import {openDatabase,LocalRepository} from '../admin/src/repository.mjs';
import {serializeBackup,tables} from '../admin/src/domain.mjs';
test('local repository CRUD and atomic restore',async()=>{const db=await openDatabase(),repo=new LocalRepository(db);const a=await repo.save('clients',{clientName:'First'});assert.equal((await repo.get('clients',a.id)).clientName,'First');await repo.save('clients',{...a,clientName:'Changed'});assert.equal((await repo.all('clients'))[0].clientName,'Changed');const records=Object.fromEntries(tables.map(t=>[t,[]]));records.clients=[{id:'restored',clientName:'Restored'}];await repo.restore(JSON.parse(serializeBackup(records)));assert.equal((await repo.all('clients'))[0].id,'restored');assert.equal(await repo.get('clients',a.id),undefined);await assert.rejects(repo.restore({format:'bad'}));assert.equal((await repo.all('clients')).length,1);await repo.delete('clients','restored');assert.equal((await repo.all('clients')).length,0);db.close()});
