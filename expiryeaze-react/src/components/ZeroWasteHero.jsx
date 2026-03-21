import React from 'react';
import './ZeroWasteHero.css';

const ZeroWasteHero = () => {
    return (
        <div className="zero-waste-hero overflow-hidden position-relative rounded-4 my-4 shadow-lg text-white" style={{ background: 'linear-gradient(135deg, #198754 0%, #0f5132 100%)', height: '250px' }}>
            <div className="position-absolute w-100 h-100 d-flex flex-column justify-content-center align-items-center text-center z-2 p-4" style={{ backgroundColor: 'rgba(0,0,0,0.4)' }}>
                <h1 className="display-5 fw-bold mb-3 shadow-sm">Zero-Waste Chef 🧑‍🍳</h1>
                <p className="lead mb-0">Turn your expiring groceries into delicious masterpieces!</p>
            </div>
            
            {/* Animated Marquee Background */}
            <div className="marquee-container d-flex z-1">
                <div className="marquee d-flex">
                    {/* Repeat images to create infinite scroll effect */}
                    {[...Array(2)].map((_, i) => (
                        <React.Fragment key={i}>
                            <img src="https://images.unsplash.com/photo-1498837167339-5f8f9811cb97?w=500&q=80" alt="Food 1" className="marquee-img" />
                            <img src="https://images.unsplash.com/photo-1473093295043-cdd812d0e601?w=500&q=80" alt="Food 2" className="marquee-img" />
                            <img src="https://images.unsplash.com/photo-1482049016688-2d3e1b311543?w=500&q=80" alt="Food 3" className="marquee-img" />
                            <img src="https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=500&q=80" alt="Food 4" className="marquee-img" />
                            <img src="https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500&q=80" alt="Food 5" className="marquee-img" />
                        </React.Fragment>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default ZeroWasteHero;
