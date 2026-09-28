import type { APIRoute } from 'astro';
import { CONTACT } from '../lib/contact.ts';
import { pageAbs } from '../lib/site.ts';

/** "Save my contact": a vCard phones open straight into their address book. */
export const GET: APIRoute = () => {
  const lines = [
    'BEGIN:VCARD',
    'VERSION:3.0',
    'N:Khaled;Mahmoud;;;',
    'FN:Mahmoud Khaled',
    'TITLE:Video editor & videographer',
    `TEL;TYPE=CELL,VOICE:${CONTACT.phoneE164}`,
    `EMAIL;TYPE=INTERNET:${CONTACT.email}`,
    `URL:${pageAbs('ar')}`,
    `X-SOCIALPROFILE;TYPE=instagram:${CONTACT.instagramUrl}`,
    'ADR;TYPE=WORK:;;;Giza;;;Egypt',
    'NOTE:محمود خالد - مونتير ومصور فيديو',
    'END:VCARD',
  ];
  return new Response(`${lines.join('\r\n')}\r\n`, { headers: { 'Content-Type': 'text/vcard; charset=utf-8' } });
};
