import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from './[...nextauth]';
import { sql } from '@vercel/postgres';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    // Check if user is authenticated and is admin
    const session = await getServerSession(req, res, authOptions);
    if (!session || session.user?.email !== 'yoniwe@gmail.com') {
      return res.status(403).json({ error: 'Forbidden' });
    }

    // Test database connection
    await sql`SELECT NOW()`;

    if (req.method === 'GET') {
      try {
        const result = await sql`
          SELECT * FROM authorized_users ORDER BY created_at DESC
        `;
        console.log('Fetched users:', result.rows);
        return res.status(200).json(result.rows);
      } catch (error) {
        console.error('Database error (GET):', error);
        return res.status(500).json({ error: 'Failed to fetch users', details: error.message });
      }
    }

    if (req.method === 'POST') {
      const { email } = req.body;
      try {
        const result = await sql`
          INSERT INTO authorized_users (email, added_by)
          VALUES (${email}, ${session.user?.email})
          RETURNING *
        `;
        console.log('Added user:', result.rows[0]);
        return res.status(200).json({ message: 'User added successfully', user: result.rows[0] });
      } catch (error) {
        console.error('Database error (POST):', error);
        return res.status(500).json({ error: 'Failed to add user', details: error.message });
      }
    }

    if (req.method === 'DELETE') {
      const { email } = req.body;
      try {
        const result = await sql`
          DELETE FROM authorized_users WHERE email = ${email}
          RETURNING *
        `;
        console.log('Deleted user:', result.rows[0]);
        return res.status(200).json({ message: 'User removed successfully', user: result.rows[0] });
      } catch (error) {
        console.error('Database error (DELETE):', error);
        return res.status(500).json({ error: 'Failed to remove user', details: error.message });
      }
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('Server error:', error);
    return res.status(500).json({ error: 'Server error', details: error.message });
  }
}
