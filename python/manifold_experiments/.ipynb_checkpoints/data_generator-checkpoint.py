import numpy as np

def generate_2d_clustered_data(n_samples=300, n_clusters=5, d=10, circle_radius=5, cluster_std=0.8, random_state=42):
    """
    Generate clustered data starting from 2D circular arrangement, then extend to d dimensions with rotation.
    
    Parameters:
    -----------
    n_samples : int, default=300
        Total number of data points to generate
    n_clusters : int, default=5
        Number of clusters to create
    d : int, default=10
        Final dimensionality of the dataset
    circle_radius : float, default=5
        Radius of the circle on which cluster centers are placed
    cluster_std : float, default=0.8
        Standard deviation of noise within each cluster
    random_state : int, default=42
        Random seed for reproducibility
        
    Returns:
    --------
    X : ndarray of shape (n_samples, d)
        The generated dataset
    y : ndarray of shape (n_samples,)
        Cluster labels for each point
    cluster_centers_2d : ndarray of shape (n_clusters, 2)
        Original 2D cluster centers before rotation
    """
    
    np.random.seed(random_state)
    
    # Step 1: Generate cluster centers in a circle in 2D
    angles = np.linspace(0, 2*np.pi, n_clusters + 1)[:-1]  # Exclude the last point (same as first)
    cluster_centers_2d = circle_radius * np.column_stack([
        np.cos(angles),
        np.sin(angles)
    ])
    
    # Step 2: Generate points around each cluster center in 2D
    points_per_cluster = n_samples // n_clusters
    remainder = n_samples % n_clusters
    
    X_2d = []
    y = []
    
    for i in range(n_clusters):
        # Add remainder points to first few clusters
        n_points = points_per_cluster + (1 if i < remainder else 0)
        
        # Generate points with Gaussian noise around cluster center
        cluster_points = np.random.normal(
            loc=cluster_centers_2d[i], 
            scale=cluster_std, 
            size=(n_points, 2)
        )
        
        X_2d.append(cluster_points)
        y.extend([i] * n_points)
    
    X_2d = np.vstack(X_2d)
    y = np.array(y)
    
    # Step 3: Extend to d dimensions
    if d > 2:
        # Add random dimensions
        #extra_dims = np.random.normal(0, 1, size=(n_samples, d - 2))
        extra_dims = np.zeros((n_samples, d - 2))
        X_extended = np.column_stack([X_2d, extra_dims])
    else:
        X_extended = X_2d
    
    # Step 4: Apply random rotation to mix the dimensions
    if d > 1:
        # Generate random orthogonal rotation matrix
        random_matrix = np.random.normal(0, 1, size=(d, d))
        rotation_matrix, _ = np.linalg.qr(random_matrix)  # QR decomposition gives orthogonal matrix
        X_rotated = X_extended @ rotation_matrix.T
    else:
        X_rotated = X_extended
    
    return X_rotated, y, cluster_centers_2d