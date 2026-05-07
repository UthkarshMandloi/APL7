import textToSpeech from '@google-cloud/text-to-speech';
import { NextResponse } from 'next/server';

const client = new textToSpeech.TextToSpeechClient();

export async function POST(req: Request) {
  try {
    const { text, emotion } = await req.json();

    let ssmlText = text;
    // Add dynamic SSML based on the emotion
    if (emotion === 'happy') {
      ssmlText = `<speak><prosody pitch="+2st" rate="1.1">${text}</prosody></speak>`;
    } else if (emotion === 'serious') {
      ssmlText = `<speak><prosody pitch="-1st" rate="0.9">${text}</prosody></speak>`;
    } else {
      ssmlText = `<speak>${text}</speak>`;
    }

    const request = {
      input: { ssml: ssmlText },
      voice: { languageCode: 'en-IN', name: 'en-IN-Neural2-B', ssmlGender: 'MALE' as const },
      audioConfig: { audioEncoding: 'MP3' as const },
    };

    const [response] = await client.synthesizeSpeech(request);

    return NextResponse.json({ audioContent: response.audioContent });
  } catch (error: any) {
    console.error('TTS Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
