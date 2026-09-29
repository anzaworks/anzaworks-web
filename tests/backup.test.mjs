import test from 'node:test';
import assert from 'node:assert/strict';
import {encryptBackup,decryptBackup} from '../admin/src/backup.mjs';
import {serializeBackup,tables} from '../admin/src/domain.mjs';
test('encrypted backup restores exact records and rejects wrong password or tampering',async()=>{const records=Object.fromEntries(tables.map(t=>[t,[]]));records.clients.push({id:'client',clientName:'Private customer'});const envelope=await encryptBackup(serializeBackup(records),'strong-password-123');assert.equal(envelope.data.includes('Private customer'),false);const restored=await decryptBackup(envelope,'strong-password-123');assert.equal(restored.records.clients[0].clientName,'Private customer');await assert.rejects(decryptBackup(envelope,'wrong-password-123'));await assert.rejects(decryptBackup({...envelope,data:envelope.data.slice(0,-4)+'AAAA'},'strong-password-123'))});
