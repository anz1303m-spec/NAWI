// Cloudinary CDN Image URL Optimization Helper for Ultra-Fast Delivery

export const getOptimizedCloudinaryUrl = (url, width = 400) => {
    if (!url) return '';
    if (!url.includes('cloudinary.com')) return url;
    
    // Inject Cloudinary auto-format (f_auto), eco quality (q_auto:eco), and width optimization
    return url.replace('/upload/', `/upload/f_auto,q_auto:eco,w_${width}/`);
};
