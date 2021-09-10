import {inject} from '@loopback/core';
import {HttpErrors} from '@loopback/rest';
import {securityId, UserProfile} from '@loopback/security';
import {promisify} from 'util';
import {TokenServiceBindings} from './keys';
const jwt = require('jsonwebtoken');
const signAsync = promisify(jwt.sign);
const verifyAsync = promisify(jwt.verify);


export class JWTService {

  constructor(
    @inject(TokenServiceBindings.TOKEN_SECRET)
    private tokenSecret: string,
    @inject(TokenServiceBindings.TOKEN_ISSUER)
    private jwtIssuer: string,
    @inject(TokenServiceBindings.TOKEN_AUDIENCE)
    private jwtAudience: string,
    @inject(TokenServiceBindings.TOKEN_ALGORITHM)
    private jwtAlgorithm: string,
    @inject(TokenServiceBindings.TOKEN_EXPIRES_IN)
    private jwtExpiresIn: string,
    @inject(TokenServiceBindings.JWT_PRIVATE_KEY)
    private jwtPrivateKey: string,
    @inject(TokenServiceBindings.JWT_PUBLIC_KEY)
    private jwtPublicKey: string
  ) {

  }

  async generateToken(userProfile: UserProfile): Promise<string> {
    if (!userProfile) {
      throw new HttpErrors.Unauthorized(
        'Error while generating token :userProfile is null'
      )
    }
    let token = '';
    try {
      // console.log('userProfile for JWT token: >> ', userProfile);
      let signOptions = {
        issuer: this.jwtIssuer,
        // subject: this.jwtAudience,
        audience: this.jwtAudience,
        expiresIn: this.jwtExpiresIn,
        algorithm: this.jwtAlgorithm
      };
      // const filePath = path.join(__dirname, '../../src/config//keys/smarthings-auth-keys/private.pem');
      // console.log('filePath: >> ', filePath);
      // const secret = fs.readFileSync(filePath, 'utf8');
      const privateKey = this.jwtPrivateKey ? this.jwtPrivateKey : this.tokenSecret;
      const secret = privateKey.replace(/\\n/gm, '\n');
      token = await signAsync(userProfile, secret, signOptions);
      return token;
    } catch (err) {
      throw new HttpErrors.Unauthorized(
        `error generating token ${err}`
      )
    }
  }

  async verifyToken(token: string): Promise<UserProfile> {

    if (!token) {
      throw new HttpErrors.Unauthorized(
        `Error verifying token:'token' is null`
      )
    };

    let userProfile: UserProfile;
    try {
      var verifyOptions = {
        issuer: this.jwtIssuer,
        // subject:  this.jwtAudience,
        audience: this.jwtAudience,
        expiresIn: this.jwtExpiresIn,
        algorithm: [this.jwtAlgorithm]
      };
      const publicKey = this.jwtPublicKey ? this.jwtPublicKey : this.tokenSecret;
      const decodeKey = publicKey.replace(/\\n/gm, '\n');
      const decryptedToken = await verifyAsync(token, decodeKey, verifyOptions);
      console.log('decryptedToken: >> ', decryptedToken);
      userProfile = Object.assign(
        {[securityId]: '', id: '', name: ''},
        {[securityId]: decryptedToken.id, id: decryptedToken.id, name: decryptedToken.name, email: decryptedToken.email}
      );

      console.log('accountId: >> ', decryptedToken['accountId']);
      if (decryptedToken['accountId']) {
        userProfile.accountId = decryptedToken['accountId'];
      }

    }
    catch (err) {
      throw new HttpErrors.Unauthorized(`Error verifying token:${err.message}`)
    }
    return userProfile;
  }
}
