// Auto-generated export for avatars
import avatar01 from './avatars/avatar-01.png';
import avatar02 from './avatars/avatar-02.png';
import avatar03 from './avatars/avatar-03.png';
import avatar04 from './avatars/avatar-04.png';
import avatar05 from './avatars/avatar-05.png';
import avatar06 from './avatars/avatar-06.png';
import avatar07 from './avatars/avatar-07.png';
import avatar08 from './avatars/avatar-08.png';
import avatar09 from './avatars/avatar-09.png';
import avatar10 from './avatars/avatar-10.png';
import avatar11 from './avatars/avatar-11.png';
import avatar12 from './avatars/avatar-12.png';

export const AVATARS: Record<string, string> = {
    'avatar-01': avatar01,
    'avatar-02': avatar02,
    'avatar-03': avatar03,
    'avatar-04': avatar04,
    'avatar-05': avatar05,
    'avatar-06': avatar06,
    'avatar-07': avatar07,
    'avatar-08': avatar08,
    'avatar-09': avatar09,
    'avatar-10': avatar10,
    'avatar-11': avatar11,
    'avatar-12': avatar12,
};

export const getAvatar = (id: string) => AVATARS[id] || AVATARS['avatar-01'];
