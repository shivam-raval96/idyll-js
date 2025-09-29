import numpy as np
import matplotlib.pyplot as plt
from sklearn.preprocessing import StandardScaler
from sklearn.decomposition import PCA, KernelPCA

def plot_pca_data(X, y, title="PCA Visualization of Clustered Data"):
    """
    Plot PCA visualization of the clustered data.
    
    Parameters:
    -----------
    X : ndarray
        The dataset
    y : ndarray
        Cluster labels
    title : str
        Plot title
    """
    # Standardize the data
    scaler = StandardScaler()
    X_scaled = scaler.fit_transform(X)
    
    # Apply PCA to reduce to 2D for visualization
    pca = PCA(n_components=2)
    X_pca = pca.fit_transform(X_scaled)
    
    # Create the plot
    plt.figure(figsize=(12, 5))
    
    # Plot 1: PCA visualization
    plt.subplot(1, 2, 1)
    colors = plt.cm.Set3(np.linspace(0, 1, len(np.unique(y))))
    
    for i, color in enumerate(colors):
        mask = y == i
        plt.scatter(X_pca[mask, 0], X_pca[mask, 1], 
                   c=[color], label=f'Cluster {i}', alpha=0.7, s=50)
    
    plt.xlabel(f'First Principal Component ({pca.explained_variance_ratio_[0]:.2%} variance)')
    plt.ylabel(f'Second Principal Component ({pca.explained_variance_ratio_[1]:.2%} variance)')
    plt.title(f'{title}\nTotal Explained Variance: {pca.explained_variance_ratio_.sum():.2%}')
    plt.legend()
    plt.grid(True, alpha=0.3)
    
    # Plot 2: Explained variance ratio
    plt.subplot(1, 2, 2)
    
    # Calculate explained variance for more components if data has more than 2 dimensions
    n_components = min(X.shape[1], 10)  # Show up to 10 components
    pca_full = PCA(n_components=n_components)
    pca_full.fit(X_scaled)
    
    plt.bar(range(1, n_components + 1), pca_full.explained_variance_ratio_)
    plt.xlabel('Principal Component')
    plt.ylabel('Explained Variance Ratio')
    plt.title('Explained Variance by Component')
    plt.xticks(range(1, n_components + 1))
    plt.grid(True, alpha=0.3)
    
    plt.tight_layout()
    plt.show()
    
    return X_pca, pca


def plot_kernel_pca_comparison(X, y, kernels=[ 'rbf', 'cosine', 'sigmoid'], 
                              title="Kernel PCA Comparison"):
    """
    Apply and visualize multiple Kernel PCA transformations.
    
    Parameters:
    -----------
    X : ndarray
        The dataset
    y : ndarray
        Cluster labels
    kernels : list
        List of kernel types to compare
    title : str
        Plot title
    """
    # Standardize the data
    scaler = StandardScaler()
    X_scaled = scaler.fit_transform(X)
    
    # Set up the plot
    n_kernels = len(kernels)
    fig, axes = plt.subplots(2, 2, figsize=(15, 12))
    axes = axes.ravel()
    
    colors = plt.cm.Set3(np.linspace(0, 1, len(np.unique(y))))
    
    kpca_results = {}
    
    for idx, kernel in enumerate(kernels):
        ax = axes[idx]
        
        # Configure kernel-specific parameters
        if kernel == 'rbf':
            # Use gamma='scale' for RBF kernel (default sklearn behavior)
            kpca = KernelPCA(n_components=2, kernel=kernel, gamma=0.3, random_state=42)
        elif kernel == 'poly':
            # Use degree 3 for polynomial kernel
            kpca = KernelPCA(n_components=2, kernel=kernel, degree=5, random_state=42)
        elif kernel == 'sigmoid':
            # Use default parameters for sigmoid
            kpca = KernelPCA(n_components=2, kernel=kernel, random_state=42)
        else:  # linear
            kpca = KernelPCA(n_components=2, kernel=kernel, random_state=42)
        
        # Fit and transform the data
        try:
            X_kpca = kpca.fit_transform(X_scaled)
            kpca_results[kernel] = (X_kpca, kpca)
            
            # Plot the results
            for i, color in enumerate(colors):
                mask = y == i
                ax.scatter(X_kpca[mask, 0], X_kpca[mask, 1], 
                          c=[color], label=f'Cluster {i}', alpha=0.7, s=50)
            
            ax.set_xlabel('First Kernel PC')
            ax.set_ylabel('Second Kernel PC')
            ax.set_title(f'Kernel PCA - {kernel.upper()} kernel')
            ax.legend()
            ax.grid(True, alpha=0.3)
            
        except Exception as e:
            ax.text(0.5, 0.5, f'Error with {kernel} kernel:\n{str(e)}', 
                   transform=ax.transAxes, ha='center', va='center')
            ax.set_title(f'Kernel PCA - {kernel.upper()} kernel (Error)')
    
    plt.suptitle(title, fontsize=16, y=0.98)
    plt.tight_layout()
    plt.show()
    
    return kpca_results