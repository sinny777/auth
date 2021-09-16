import {Provider} from '@loopback/core';
import {v4 as uuidv4} from 'uuid';

export class UuidProvider implements Provider<string> {
  value() {
    const generatedId = uuidv4();
    console.log('IN UuidProvider >>>>>>>>>>> ', generatedId);
    return generatedId;
  }
}
