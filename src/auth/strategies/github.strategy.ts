import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-github2';
import { ConfigService } from '@nestjs/config';
import { Profile } from 'passport-github2';

@Injectable()
export class GitHubStrategy extends PassportStrategy(Strategy, 'github') {
  constructor(private configService: ConfigService) {
    super({
      clientID: configService.get('GITHUB_CLIENT_ID'),
      clientSecret: configService.get('GITHUB_CLIENT_SECRET'),
      callbackURL: configService.get('GITHUB_CALLBACK_URL'),
      scope: ['user:email'],
    });
  }

  async validate(
    accessToken: string,
    refreshToken: string,
    profile: Profile,
    done: (error: any, user?: any) => void,
  ): Promise<any> {
    const { id, username, displayName, emails, photos } = profile;

    const user = {
      id,
      username,
      email: emails?.[0]?.value || `${username}@github.local`,
      displayName: displayName || username,
      firstName: ((displayName || username) || '').split(' ')[0] || username || 'User',
      lastName: ((displayName || username) || '').split(' ').slice(1).join(' ') || '',
      picture: photos?.[0]?.value || '',
      accessToken,
    };

    done(null, user);
  }
}
