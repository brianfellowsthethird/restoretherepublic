// API route to submit a vote
import { supabase } from './supabase';

// Generate a simple visitor ID (you can enhance this with fingerprinting)
function getVisitorId(req) {
    // Try to get from cookie first
    const cookies = req.headers.cookie || '';
    const visitorIdMatch = cookies.match(/visitor_id=([^;]+)/);
    if (visitorIdMatch) {
        return visitorIdMatch[1];
    }
    
    // Generate new visitor ID
    return `visitor_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { itemId } = req.body;

    if (!itemId) {
        return res.status(400).json({ error: 'itemId is required' });
    }

    try {
        const visitorId = getVisitorId(req);

        // Check if this visitor already voted for this item
        const { data: existingVote, error: checkError } = await supabase
            .from('visitor_votes')
            .select('*')
            .eq('visitor_id', visitorId)
            .eq('item_id', itemId)
            .single();

        if (checkError && checkError.code !== 'PGRST116') { // PGRST116 = not found
            console.error('Error checking existing vote:', checkError);
            return res.status(500).json({ error: 'Failed to check vote' });
        }

        if (existingVote) {
            return res.status(400).json({ error: 'Already voted for this item' });
        }

        // Record the vote
        const { error: voteError } = await supabase
            .from('visitor_votes')
            .insert({ visitor_id: visitorId, item_id: itemId });

        if (voteError) {
            console.error('Error recording vote:', voteError);
            return res.status(500).json({ error: 'Failed to record vote' });
        }

        // Increment vote count (using upsert)
        const { error: countError } = await supabase.rpc('increment_vote', {
            item_id: itemId
        });

        if (countError) {
            // Fallback: manually update count
            const { data: currentVote } = await supabase
                .from('votes')
                .select('count')
                .eq('item_id', itemId)
                .single();

            const newCount = (currentVote?.count || 0) + 1;

            await supabase
                .from('votes')
                .upsert({ item_id: itemId, count: newCount }, { onConflict: 'item_id' });
        }

        // Set cookie for visitor ID
        res.setHeader('Set-Cookie', `visitor_id=${visitorId}; Path=/; Max-Age=31536000; SameSite=Lax`);

        res.status(200).json({ success: true, itemId });
    } catch (error) {
        console.error('Error submitting vote:', error);
        res.status(500).json({ error: 'Failed to submit vote' });
    }
}
