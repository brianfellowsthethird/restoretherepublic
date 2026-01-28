// Voting System with API Backend
class ManifestoVoting {
    constructor() {
        this.votedKey = 'manifesto_voted_items';
        this.items = [];
        this.votes = {};
        this.votedItems = this.loadVotedItems();
        
        this.loadVotes().then(() => {
            this.init();
        });
    }

    async loadVotes() {
        try {
            const response = await fetch('/api/votes');
            if (response.ok) {
                const data = await response.json();
                this.votes = data.votes || {};
            }
        } catch (error) {
            console.error('Failed to load votes:', error);
            this.votes = {};
        }
    }

    loadVotedItems() {
        try {
            const stored = localStorage.getItem(this.votedKey);
            return stored ? JSON.parse(stored) : [];
        } catch (e) {
            return [];
        }
    }

    saveVotedItems() {
        try {
            localStorage.setItem(this.votedKey, JSON.stringify(this.votedItems));
        } catch (e) {
            console.error('Failed to save voted items:', e);
        }
    }

    init() {
        // Get all manifesto items
        const items = document.querySelectorAll('.manifesto-item');
        this.items = Array.from(items);

        // Initialize vote counts and buttons
        this.items.forEach(item => {
            const id = item.dataset.id;
            const voteCountEl = item.querySelector('.vote-count');
            const voteButton = item.querySelector('.vote-button');
            
            // Set initial vote count
            const count = this.votes[id] || 0;
            voteCountEl.textContent = count;

            // Check if already voted
            if (this.votedItems.includes(id)) {
                voteButton.classList.add('voted');
                voteButton.disabled = true;
                voteButton.querySelector('.vote-text').textContent = 'Voted';
            }

            // Add click handler
            voteButton.addEventListener('click', () => this.handleVote(id, item));
        });

        // Initial sort
        this.sortItems();
    }

    async handleVote(id, itemElement) {
        // Check if already voted for this item
        if (this.votedItems.includes(id)) {
            return;
        }

        const voteButton = itemElement.querySelector('.vote-button');
        const voteCountEl = itemElement.querySelector('.vote-count');
        
        // Disable button while processing
        voteButton.disabled = true;
        const originalText = voteButton.querySelector('.vote-text').textContent;
        voteButton.querySelector('.vote-text').textContent = 'Voting...';

        try {
            const response = await fetch('/api/vote', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ itemId: id }),
            });

            const data = await response.json();

            if (response.ok && data.success) {
                // Update local state
                this.votes[id] = (this.votes[id] || 0) + 1;
                this.votedItems.push(id);
                this.saveVotedItems();

                // Update UI
                voteCountEl.textContent = this.votes[id];
                voteButton.classList.add('voted');
                voteButton.querySelector('.vote-text').textContent = 'Voted';

                // Sort items
                this.sortItems();
            } else {
                // Error - re-enable button
                voteButton.disabled = false;
                voteButton.querySelector('.vote-text').textContent = originalText;
                
                if (data.error === 'Already voted for this item') {
                    // Mark as voted locally
                    this.votedItems.push(id);
                    this.saveVotedItems();
                    voteButton.classList.add('voted');
                    voteButton.disabled = true;
                    voteButton.querySelector('.vote-text').textContent = 'Voted';
                } else {
                    alert('Failed to submit vote. Please try again.');
                }
            }
        } catch (error) {
            console.error('Error submitting vote:', error);
            voteButton.disabled = false;
            voteButton.querySelector('.vote-text').textContent = originalText;
            alert('Failed to submit vote. Please try again.');
        }
    }

    sortItems() {
        const container = document.getElementById('manifesto-points');
        if (!container) return;

        // Get current items
        const items = Array.from(container.querySelectorAll('.manifesto-item'));

        // Sort by vote count (descending), then by original number
        items.sort((a, b) => {
            const idA = a.dataset.id;
            const idB = b.dataset.id;
            const votesA = this.votes[idA] || 0;
            const votesB = this.votes[idB] || 0;

            if (votesA !== votesB) {
                return votesB - votesA; // Higher votes first
            }
            return parseInt(idA) - parseInt(idB); // Then by original number
        });

        // Add reordering class for animation
        items.forEach(item => {
            item.classList.add('reordering');
        });

        // Reorder in DOM
        items.forEach((item, index) => {
            // Use requestAnimationFrame for smooth animation
            requestAnimationFrame(() => {
                container.appendChild(item);
                
                // Remove reordering class after a short delay
                setTimeout(() => {
                    item.classList.remove('reordering');
                }, 100);
            });
        });
    }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        new ManifestoVoting();
        initShareButton();
        initScrollFade();
    });
} else {
    new ManifestoVoting();
    initShareButton();
    initScrollFade();
}

// Share functionality
function initShareButton() {
    const shareButton = document.querySelector('.share-button');
    if (!shareButton) return;

    shareButton.addEventListener('click', async () => {
        const url = window.location.href;
        const title = 'Manifesto';
        const text = 'A manifesto for restoring balance, competition, and the republic.';

        // Try Web Share API first (mobile devices)
        if (navigator.share) {
            try {
                await navigator.share({
                    title: title,
                    text: text,
                    url: url
                });
            } catch (err) {
                // User cancelled or error occurred
                if (err.name !== 'AbortError') {
                    console.error('Error sharing:', err);
                }
            }
        } else {
            // Fallback: copy to clipboard
            try {
                await navigator.clipboard.writeText(url);
                // Show feedback
                const originalText = shareButton.querySelector('.share-text').textContent;
                shareButton.querySelector('.share-text').textContent = 'Copied!';
                setTimeout(() => {
                    shareButton.querySelector('.share-text').textContent = originalText;
                }, 2000);
            } catch (err) {
                console.error('Failed to copy:', err);
                // Fallback for older browsers
                const textArea = document.createElement('textarea');
                textArea.value = url;
                textArea.style.position = 'fixed';
                textArea.style.opacity = '0';
                document.body.appendChild(textArea);
                textArea.select();
                try {
                    document.execCommand('copy');
                    const originalText = shareButton.querySelector('.share-text').textContent;
                    shareButton.querySelector('.share-text').textContent = 'Copied!';
                    setTimeout(() => {
                        shareButton.querySelector('.share-text').textContent = originalText;
                    }, 2000);
                } catch (err) {
                    console.error('Fallback copy failed:', err);
                }
                document.body.removeChild(textArea);
            }
        }
    });
}

// Scroll fade-in animation
function initScrollFade() {
    const items = document.querySelectorAll('.manifesto-item');
    if (!items.length) return;

    // Options for Intersection Observer
    const options = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('fade-in');
                // Unobserve after animation to improve performance
                observer.unobserve(entry.target);
            }
        });
    }, options);

    // Observe all manifesto items
    items.forEach(item => {
        observer.observe(item);
    });
}

