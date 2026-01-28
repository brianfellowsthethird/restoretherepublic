// API route to get all vote counts
import { supabase } from './supabase';

export default async function handler(req, res) {
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        // Fetch all vote counts from Supabase
        const { data, error } = await supabase
            .from('votes')
            .select('item_id, count');

        if (error) {
            console.error('Supabase error:', error);
            return res.status(500).json({ error: 'Failed to fetch votes' });
        }

        // Convert array to object: { "1": 5, "2": 3, ... }
        const votes = {};
        if (data) {
            data.forEach(row => {
                votes[row.item_id] = row.count;
            });
        }

        res.status(200).json({ votes });
    } catch (error) {
        console.error('Error fetching votes:', error);
        res.status(500).json({ error: 'Failed to fetch votes' });
    }
}
