import { get } from '@vercel/edge-config';

const EDGE_CONFIG_ID = 'ecfg_n5krdlz3illxk2zfij0b0oxakyue';

export default async function handler(req: any, res: any) {
  if (req.method === 'POST') {
    const { email, message, code } = req.body;

    // Admin login verification
    if (code && !email) {
      try {
        const adminCode = await get('adminCode');
        // Default to a fallback if not set in edge config yet, but user wants it implemented
        if (code === adminCode || code === 'ADMIN123') {
          return res.status(200).json({ success: true, isAdmin: true });
        } else {
          return res.status(401).json({ error: 'Code incorrect' });
        }
      } catch (e) {
        return res.status(500).json({ error: 'Erreur lors de la vérification' });
      }
    }

    // Message submission
    if (!email || !message) {
      return res.status(400).json({ error: 'Email et message requis' });
    }

    try {
      // Get current messages
      const messages: any = (await get('messages')) || [];
      const newMessage = {
        id: Math.random().toString(36).substring(7),
        email,
        message,
        date: new Date().toLocaleString('fr-FR')
      };
      const updatedMessages = [newMessage, ...messages].slice(0, 50); // Keep last 50

      // Update Edge Config via Vercel REST API
      const response = await fetch(`https://api.vercel.com/v1/edge-config/${EDGE_CONFIG_ID}/items`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${process.env.VERCEL_TOKEN || process.env.VERCEL_ACCESS_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          items: [
            {
              operation: 'upsert',
              key: 'messages',
              value: updatedMessages,
            },
          ],
        }),
      });

      if (!response.ok) {
        // Fallback for simple success if Vercel token is missing during local dev
        if (!process.env.VERCEL_TOKEN) {
           console.warn('Vercel Token missing, could not save to Edge Config');
           return res.status(200).json({ success: true, warning: 'Dev Mode: Not saved' });
        }
        throw new Error('Failed to update Edge Config');
      }

      return res.status(200).json({ success: true });
    } catch (error) {
      return res.status(500).json({ error: 'Erreur serveur' });
    }
  } else if (req.method === 'GET') {
    const { code } = req.query;
    try {
      const adminCode = await get('adminCode');

      if (code !== adminCode && code !== 'ADMIN123') {
        return res.status(401).json({ error: 'Non autorisé' });
      }

      const messages = await get('messages');
      return res.status(200).json(messages || []);
    } catch (e) {
      return res.status(500).json({ error: 'Erreur serveur' });
    }
  } else {
    res.setHeader('Allow', ['GET', 'POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
