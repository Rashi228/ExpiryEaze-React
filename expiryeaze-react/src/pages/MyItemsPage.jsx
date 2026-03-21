import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { config } from '../lib/config';
import ZeroWasteHero from '../components/ZeroWasteHero';
import { Clock, CheckCircle2, ChefHat, PlayCircle, Loader2 } from 'lucide-react';

// Mock data to demonstrate pantry functionality since dynamic backend model is out of scope 
const mockUserItems = [
    { id: 1, name: 'Milk', status: 'Expiring Today', expiryDate: new Date() },
    { id: 2, name: 'Spinach', status: 'Expiring Today', expiryDate: new Date() },
    { id: 3, name: 'Bread', status: 'Active', expiryDate: new Date(Date.now() + 86400000 * 3) },
    { id: 4, name: 'Eggs', status: 'Active', expiryDate: new Date(Date.now() + 86400000 * 5) },
];

const MyItemsPage = () => {
    const { user } = useAuth();
    const [items] = useState(mockUserItems);
    const [loading, setLoading] = useState(false);
    const [recipe, setRecipe] = useState(null);
    const [error, setError] = useState('');

    const handleGenerateRecipe = async () => {
        setLoading(true);
        setError('');
        setRecipe(null);

        // Get expiring today and active items
        const ingredients = items
            .filter(i => i.status === 'Expiring Today' || i.status === 'Active')
            .map(i => i.name);

        try {
            const response = await fetch(`${config.API_URL}/recipes/generate`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ ingredients })
            });

            const data = await response.json();

            if (data.success) {
                setRecipe(data);
            } else {
                setError(data.error || 'Failed to generate recipe. Please try again.');
            }
        } catch (err) {
            setError('An error occurred while communicating with the chef! Ensure backend is running.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="container py-4">
            <ZeroWasteHero />

            <div className="row mt-4">
                {/* User's Pantry / Items List */}
                <div className="col-lg-4 mb-4">
                    <div className="card shadow-sm h-100 border-0 rounded-4">
                        <div className="card-header bg-white border-bottom-0 pt-4 pb-0">
                            <h4 className="fw-bold d-flex align-items-center gap-2">
                                🛒 My Pantry Items
                            </h4>
                            <p className="text-muted small">Items tracked in your account</p>
                        </div>
                        <div className="card-body">
                            <ul className="list-group list-group-flush">
                                {items.map(item => (
                                    <li key={item.id} className="list-group-item px-0 d-flex justify-content-between align-items-center border-0 mb-2">
                                        <div>
                                            <h6 className="mb-0 fw-semibold">{item.name}</h6>
                                            <small className="text-muted d-block">Exp: {item.expiryDate.toLocaleDateString()}</small>
                                        </div>
                                        <span className={`badge rounded-pill ${item.status === 'Expiring Today' ? 'bg-danger' : 'bg-success'}`}>
                                            {item.status}
                                        </span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                        <div className="card-footer bg-white border-top-0 pb-4">
                            <button 
                                onClick={handleGenerateRecipe}
                                disabled={loading || items.length === 0}
                                className="btn btn-success w-100 py-2 fw-bold d-flex align-items-center justify-content-center gap-2 shadow-sm"
                                style={{ borderRadius: '12px' }}
                            >
                                {loading ? <Loader2 className="spinner-border spinner-border-sm" /> : <ChefHat size={20} />}
                                {loading ? 'Chef is cooking...' : 'Generate Magic Recipe'}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Recipe Display Section */}
                <div className="col-lg-8">
                    {error && (
                        <div className="alert alert-danger shadow-sm border-0 rounded-4 mb-3">
                            <strong>Oops!</strong> {error}
                        </div>
                    )}

                    {!recipe && !loading && !error && (
                        <div className="card shadow-sm border-0 h-100 d-flex align-items-center justify-content-center bg-light rounded-4" style={{ minHeight: '400px' }}>
                            <div className="text-center p-5">
                                <ChefHat size={60} className="text-success mb-3 opacity-50 mx-auto" />
                                <h4 className="text-muted fw-bold">Ready to cook?</h4>
                                <p className="text-muted mx-auto" style={{ maxWidth: '300px' }}>Click the button to let our AI generate a zero-waste recipe using your available ingredients.</p>
                            </div>
                        </div>
                    )}

                    {loading && (
                        <div className="card shadow-sm border-0 h-100 d-flex align-items-center justify-content-center rounded-4" style={{ minHeight: '400px', backgroundColor: '#f8f9fa' }}>
                            <div className="text-center p-5">
                                <div className="spinner-grow text-success mb-3" style={{ width: '3rem', height: '3rem' }} role="status">
                                    <span className="visually-hidden">Loading...</span>
                                </div>
                                <h4 className="text-success fw-bold">Consulting the AI Chef...</h4>
                                <p className="text-muted">Analyzing your ingredients and finding the best recipe...</p>
                            </div>
                        </div>
                    )}

                    {recipe && !loading && (
                        <div className="card shadow-sm border-0 rounded-4 overflow-hidden">
                            <div className="card-header p-4" style={{ background: 'linear-gradient(135deg, #198754, #20c997)', color: 'white' }}>
                                <h3 className="fw-bold mb-1">{recipe.recipeName}</h3>
                                <div className="d-flex flex-wrap gap-2 mt-2">
                                    <span className="badge bg-white text-success d-flex align-items-center gap-1 shadow-sm">
                                        <Clock size={14} /> {recipe.cookingTime || '20 mins'}
                                    </span>
                                    {recipe.tags && recipe.tags.map((tag, idx) => (
                                        <span key={idx} className="badge bg-dark bg-opacity-25 border border-light text-white shadow-sm">
                                            {tag}
                                        </span>
                                    ))}
                                </div>
                            </div>
                            
                            <div className="card-body p-4">
                                {recipe.video && (
                                    <div className="mb-4">
                                        <h5 className="fw-bold d-flex align-items-center gap-2 mb-3">
                                            <PlayCircle className="text-danger" /> 
                                            Recipe Video Tutorial
                                        </h5>
                                        <div className="ratio ratio-16x9 rounded-4 overflow-hidden shadow-sm">
                                            <iframe 
                                                src={`https://www.youtube.com/embed/${recipe.video.url.split('v=')[1]?.split('&')[0]}`} 
                                                title={recipe.video.title} 
                                                allowFullScreen
                                                className="border-0"
                                            ></iframe>
                                        </div>
                                    </div>
                                )}

                                <h5 className="fw-bold mb-3 d-flex align-items-center gap-2">
                                    🍳 Step-by-Step Instructions
                                </h5>
                                <div className="list-group list-group-flush list-group-numbered">
                                    {recipe.steps && recipe.steps.map((step, idx) => (
                                        <div key={idx} className="list-group-item border-0 py-3 ps-3 pe-0 d-flex align-items-start gap-3">
                                            <div className="bg-success text-white rounded-circle d-flex align-items-center justify-content-center flex-shrink-0 mt-1" style={{ width: '28px', height: '28px', fontSize: '14px', fontWeight: 'bold' }}>
                                                {idx + 1}
                                            </div>
                                            <p className="mb-0 fs-6 text-dark" style={{ lineHeight: '1.6' }}>{step}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <div className="card-footer bg-light p-3 text-center text-muted small border-0">
                                Generated by ExpiryEaze Zero-Waste Chef AI
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default MyItemsPage;
