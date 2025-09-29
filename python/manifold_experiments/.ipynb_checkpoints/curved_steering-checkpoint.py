import numpy as np
import matplotlib.pyplot as plt
from sklearn.decomposition import PCA, KernelPCA
from sklearn.preprocessing import StandardScaler

class CurvedSteering:
    """
    A class for smoothly steering points along the circular cluster path.
    """
    
    def __init__(self, X, y, method='pca', kernel='rbf'):
        """
        Initialize the curved steering system.
        
        Parameters:
        -----------
        X : ndarray
            The dataset
        y : ndarray
            Cluster labels
        method : str
            'pca' or 'kernel_pca'
        kernel : str
            Kernel type if using kernel_pca
        """
        self.X = X
        self.y = y
        self.method = method
        self.kernel = kernel
        
        # Standardize the data
        self.scaler = StandardScaler()
        self.X_scaled = self.scaler.fit_transform(X)
        
        # Fit the dimensionality reduction model
        self._fit_projection_model()
        
        # Find the circular structure
        self._find_circular_structure()
    
    def _fit_projection_model(self):
        """Fit PCA or Kernel PCA model."""
        if self.method == 'pca':
            self.projection_model = PCA(n_components=2)
        else:  # kernel_pca
            self.projection_model = KernelPCA(n_components=2, kernel=self.kernel, random_state=42, fit_inverse_transform = True)
        
        self.X_2d = self.projection_model.fit_transform(self.X_scaled)
    
    def _find_circular_structure(self):
        """Find the best-fit circle through cluster centers."""
        # Calculate cluster centers in 2D projection
        unique_labels = np.unique(self.y)
        cluster_centers_2d = []
        
        for label in unique_labels:
            mask = self.y == label
            center = np.mean(self.X_2d[mask], axis=0)
            cluster_centers_2d.append(center)
        
        cluster_centers_2d = np.array(cluster_centers_2d)
        
        # Fit circle to cluster centers
        self.circle_center, self.circle_radius = self._fit_circle(cluster_centers_2d)
        
        print(f"Fitted circle: center=({self.circle_center[0]:.2f}, {self.circle_center[1]:.2f}), radius={self.circle_radius:.2f}")
    
    def _fit_circle(self, points):
        """Fit a circle to a set of 2D points."""
        # Simple circle fitting using least squares
        def calc_radius(center):
            return np.mean(np.sqrt(np.sum((points - center)**2, axis=1)))
        
        def objective(params):
            center = np.array([params[0], params[1]])
            distances = np.sqrt(np.sum((points - center)**2, axis=1))
            radius = np.mean(distances)
            return np.sum((distances - radius)**2)
        
        # Initial guess: centroid of points
        initial_center = np.mean(points, axis=0)
        
        # Simple grid search for circle center
        from scipy.optimize import minimize
        result = minimize(objective, initial_center, method='BFGS')
        
        center = result.x
        radius = calc_radius(center)
        
        return center, radius
    
    def project_point_to_circle(self, point_idx):
        """
        Project a point to the fitted circle and get its angular position.
        
        Parameters:
        -----------
        point_idx : int
            Index of the point to project
            
        Returns:
        --------
        angle : float
            Angular position on the circle (in radians)
        circle_point_2d : ndarray
            2D coordinates of the projected point on the circle
        """
        # Get 2D projection of the point
        point_2d = self.X_2d[point_idx]
        
        # Vector from circle center to point
        vec_to_point = point_2d - self.circle_center
        
        # Calculate angle
        angle = np.arctan2(vec_to_point[1], vec_to_point[0])
        
        # Project onto circle
        circle_point_2d = self.circle_center + self.circle_radius * np.array([np.cos(angle), np.sin(angle)])
        
        return angle, circle_point_2d
    
    def generate_steering_vector(self, point_idx, step_size=0.1, direction=1):
        """
        Generate a steering vector to move a point along the circle.
        
        Parameters:
        -----------
        point_idx : int
            Index of the point to steer
        step_size : float
            How far to move (in radians)
        direction : int
            1 for counterclockwise, -1 for clockwise
            
        Returns:
        --------
        steering_vector : ndarray
            High-dimensional steering vector
        new_angle : float
            New angular position
        """
        # Get current position on circle
        current_angle, current_circle_point = self.project_point_to_circle(point_idx)
        
        # Calculate new angle
        new_angle = current_angle + direction * step_size
        
        # New position on circle
        new_circle_point = self.circle_center + self.circle_radius * np.array([np.cos(new_angle), np.sin(new_angle)])
        
        # 2D displacement vector
        displacement_2d = new_circle_point - current_circle_point
        
        # Project back to high-dimensional space
        steering_vector = self._project_2d_to_high_dim(displacement_2d)
        
        return steering_vector, new_angle
    
    def _project_2d_to_high_dim(self, vec_2d):
        """Project a 2D vector back to high-dimensional space."""
        if self.method == 'pca':
            # For PCA, we can use the components directly
            return vec_2d @ self.projection_model.components_
        else:
            # For Kernel PCA, this is more complex - we approximate using finite differences
            # Create a small perturbation in 2D and see how it affects the reconstruction
            
            # This is an approximation - for exact inverse we'd need the pre-image problem solution
            # We'll use the PCA approximation as a reasonable proxy
            #pca_approx = PCA(n_components=2)
            #pca_approx.fit(self.X_scaled)
            return self.projection_model.inverse_transform(vec_2d.reshape(1, -1))
    
    def steer_point(self, point_idx, step_size=0.1, direction=1, strength=0.3):
        """
        Apply steering to a point.
        
        Parameters:
        -----------
        point_idx : int
            Index of the point to steer
        step_size : float
            How far to move along the circle
        direction : int
            1 for counterclockwise, -1 for clockwise
        strength : float
            How much of the steering vector to apply (0-1)
            
        Returns:
        --------
        new_point : ndarray
            The steered point in high-dimensional space
        steering_info : dict
            Information about the steering operation
        """
        steering_vector, new_angle = self.generate_steering_vector(point_idx, step_size, direction)
        
        # Apply steering with specified strength
        original_point = self.X[point_idx]
        new_point = original_point + strength * steering_vector
        
        steering_info = {
            'original_point': original_point,
            'steering_vector': steering_vector,
            'new_angle': new_angle,
            'step_size': step_size,
            'direction': direction,
            'strength': strength
        }
        
        return new_point, steering_info

    def steer_multiple_steps(self, point_idx, step_size=0.1, direction=1, strength=0.3, n_steps=10):
        """
        Apply steering for multiple steps, recalculating the steering vector at each step.
        
        Parameters:
        -----------
        point_idx : int
            Index of the initial point to steer
        step_size : float
            How far to move per step
        direction : int
            Direction of movement
        strength : float
            Steering strength
        n_steps : int
            Number of steering steps
            
        Returns:
        --------
        steered_points : list
            List of points after each steering step
        steering_info_list : list
            List of steering information for each step
        """
        steered_points = []
        steering_info_list = []
        
        # Start with the original point
        current_point = self.X[point_idx].copy()
        steered_points.append(current_point.copy())
        
        for step in range(n_steps):
            # Recalculate steering vector based on current point position
            steering_vector, new_angle = self._generate_steering_vector_for_point(
                current_point, step_size, direction
            )
            
            # Apply steering
            current_point = current_point + strength * steering_vector
            steered_points.append(current_point.copy())
            
            # Store steering info
            steering_info = {
                'step': step,
                'steering_vector': steering_vector,
                'new_angle': new_angle,
                'step_size': step_size,
                'direction': direction,
                'strength': strength
            }
            steering_info_list.append(steering_info)
        
        return steered_points, steering_info_list
    
    def steer_arbitrary_point(self, point, step_size=0.1, direction=1, strength=0.3):
        """
        Steer any arbitrary point (not necessarily from the original dataset).
        
        Parameters:
        -----------
        point : ndarray
            The point to steer (shape: (n_features,))
        step_size : float
            How far to move along the circle
        direction : int
            1 for counterclockwise, -1 for clockwise
        strength : float
            How much of the steering vector to apply (0-1)
            
        Returns:
        --------
        new_point : ndarray
            The steered point in high-dimensional space
        steering_info : dict
            Information about the steering operation
        """
        steering_vector, new_angle = self._generate_steering_vector_for_point(
            point, step_size, direction
        )
        
        # Apply steering with specified strength
        new_point = point + strength * steering_vector
        
        steering_info = {
            'original_point': point,
            'steering_vector': steering_vector,
            'new_angle': new_angle,
            'step_size': step_size,
            'direction': direction,
            'strength': strength
        }
        
        return new_point, steering_info
    
    def steer_arbitrary_point_multiple_steps(self, point, step_size=0.1, direction=1, strength=0.3, n_steps=10):
        """
        Apply steering for multiple steps to an arbitrary point.
        
        Parameters:
        -----------
        point : ndarray
            Initial point to steer (shape: (n_features,))
        step_size : float
            How far to move per step
        direction : int
            Direction of movement
        strength : float
            Steering strength
        n_steps : int
            Number of steering steps
            
        Returns:
        --------
        steered_points : list
            List of points after each steering step
        steering_info_list : list
            List of steering information for each step
        """
        steered_points = []
        steering_info_list = []
        
        # Start with the given point
        current_point = point.copy()
        steered_points.append(current_point.copy())
        
        for step in range(n_steps):
            # Recalculate steering vector based on current point position
            steering_vector, new_angle = self._generate_steering_vector_for_point(
                current_point, step_size, direction
            )
            
            # Apply steering
            current_point = current_point + strength * steering_vector
            steered_points.append(current_point.copy())
            
            # Store steering info
            steering_info = {
                'step': step,
                'steering_vector': steering_vector,
                'new_angle': new_angle,
                'step_size': step_size,
                'direction': direction,
                'strength': strength
            }
            steering_info_list.append(steering_info)
        
        return steered_points, steering_info_list
    
    def visualize_arbitrary_point_steering(self, point, step_size=0.1, direction=1, strength=0.3, n_steps=10):
        """
        Visualize steering of an arbitrary point.
        
        Parameters:
        -----------
        point : ndarray
            The point to steer
        step_size : float
            How far to move per step
        direction : int
            Direction of movement
        strength : float
            Steering strength
        n_steps : int
            Number of steps to visualize
        """
        fig, ax1 = plt.subplots(1, 1, figsize=(8, 6))
        
        # Colors for visualization
        colors = plt.cm.Set3(np.linspace(0, 1, len(np.unique(self.y))))
        
        # Plot 1: 2D projection showing the circular path
        ax1.scatter(self.X_2d[:, 0], self.X_2d[:, 1], c=[colors[label] for label in self.y], 
                   alpha=0.3, s=30, label='Original Data')
        
        # Draw the fitted circle
        circle_angles = np.linspace(0, 2*np.pi, 100)
        circle_x = self.circle_center[0] + self.circle_radius * np.cos(circle_angles)
        circle_y = self.circle_center[1] + self.circle_radius * np.sin(circle_angles)
        ax1.plot(circle_x, circle_y, 'k--', alpha=0.5, label='Fitted Circle')
        
        # Use the corrected steering method for arbitrary point
        steered_points, steering_info_list = self.steer_arbitrary_point_multiple_steps(
            point, step_size, direction, strength, n_steps
        )
        
        # Plot the path with recalculated steering
        path_2d = []
        for i, steered_point in enumerate(steered_points):
            # Project each steered point to 2D for visualization
            point_scaled = self.scaler.transform(steered_point.reshape(1, -1))
            point_2d = self.projection_model.transform(point_scaled)[0]
            path_2d.append(point_2d)
            
            if i == 0:
                ax1.scatter(point_2d[0], point_2d[1], c='red', s=120, marker='*', 
                           label='Start (Arbitrary Point)', zorder=5, edgecolors='black')
            elif i == len(steered_points) - 1:
                ax1.scatter(point_2d[0], point_2d[1], c='blue', s=120, marker='*', 
                           label='End', zorder=5, edgecolors='black')
        
        # Plot the path
        path_2d = np.array(path_2d)
        ax1.plot(path_2d[:, 0], path_2d[:, 1], 'r-', linewidth=3, alpha=0.8, label='Steering Path')
        
        # Show intermediate points
        ax1.scatter(path_2d[1:-1, 0], path_2d[1:-1, 1], c='orange', s=50, alpha=0.8, 
                   label='Intermediate Points', zorder=4, edgecolors='red')
        
        ax1.set_xlabel('First Component')
        ax1.set_ylabel('Second Component')
        ax1.set_title(f'Arbitrary Point Steering ({self.method.upper()})\nStays on Circle')
        ax1.legend()
        ax1.grid(True, alpha=0.3)
        

        plt.tight_layout()
        plt.show()
        
        return steered_points, steering_info_list
        """
        Apply steering for multiple steps, recalculating the steering vector at each step.
        
        Parameters:
        -----------
        point_idx : int
            Index of the initial point to steer
        step_size : float
            How far to move per step
        direction : int
            Direction of movement
        strength : float
            Steering strength
        n_steps : int
            Number of steering steps
            
        Returns:
        --------
        steered_points : list
            List of points after each steering step
        steering_info_list : list
            List of steering information for each step
        """
        steered_points = []
        steering_info_list = []
        
        # Start with the original point
        current_point = self.X[point_idx].copy()
        steered_points.append(current_point.copy())
        
        for step in range(n_steps):
            # Recalculate steering vector based on current point position
            steering_vector, new_angle = self._generate_steering_vector_for_point(
                current_point, step_size, direction
            )
            
            # Apply steering
            current_point = current_point + strength * steering_vector
            steered_points.append(current_point.copy())
            
            # Store steering info
            steering_info = {
                'step': step,
                'steering_vector': steering_vector,
                'new_angle': new_angle,
                'step_size': step_size,
                'direction': direction,
                'strength': strength
            }
            steering_info_list.append(steering_info)
        
        return steered_points, steering_info_list
    
    def _generate_steering_vector_for_point(self, point, step_size=0.1, direction=1):
        """
        Generate steering vector for an arbitrary point (not necessarily in the original dataset).
        
        Parameters:
        -----------
        point : ndarray
            The point to generate steering for
        step_size : float
            How far to move (in radians)
        direction : int
            1 for counterclockwise, -1 for clockwise
            
        Returns:
        --------
        steering_vector : ndarray
            High-dimensional steering vector
        new_angle : float
            New angular position
        """
        # Project point to 2D
        point_scaled = self.scaler.transform(point.reshape(1, -1))
        point_2d = self.projection_model.transform(point_scaled)[0]
        
        # Get current position on circle
        vec_to_point = point_2d - self.circle_center
        current_angle = np.arctan2(vec_to_point[1], vec_to_point[0])
        current_circle_point = self.circle_center + self.circle_radius * np.array([np.cos(current_angle), np.sin(current_angle)])
        
        # Calculate new angle
        new_angle = current_angle + direction * step_size
        
        # New position on circle
        new_circle_point = self.circle_center + self.circle_radius * np.array([np.cos(new_angle), np.sin(new_angle)])
        
        # 2D displacement vector
        displacement_2d = new_circle_point - current_circle_point
        
        # Project back to high-dimensional space
        steering_vector = self._project_2d_to_high_dim(displacement_2d)
        
        return steering_vector, new_angle

    def visualize_steering(self, point_idx, step_size=0.1, direction=1, strength=0.3, n_steps=10):
        """
        Visualize the steering process step by step with recalculated steering vectors.
        
        Parameters:
        -----------
        point_idx : int
            Index of the point to steer
        step_size : float
            How far to move per step
        direction : int
            Direction of movement
        strength : float
            Steering strength
        n_steps : int
            Number of steps to visualize
        """
        fig, ax1 = plt.subplots(1, 1, figsize=(8, 6))
        
        # Colors for visualization
        colors = plt.cm.Set3(np.linspace(0, 1, len(np.unique(self.y))))
        
        # Plot 1: 2D projection showing the circular path
        ax1.scatter(self.X_2d[:, 0], self.X_2d[:, 1], c=[colors[label] for label in self.y], 
                   alpha=0.3, s=30)
        
        # Draw the fitted circle
        circle_angles = np.linspace(0, 2*np.pi, 100)
        circle_x = self.circle_center[0] + self.circle_radius * np.cos(circle_angles)
        circle_y = self.circle_center[1] + self.circle_radius * np.sin(circle_angles)
        ax1.plot(circle_x, circle_y, 'k--', alpha=0.5, label='Fitted Circle')
        
        # Use the corrected steering method
        steered_points, steering_info_list = self.steer_multiple_steps(
            point_idx, step_size, direction, strength, n_steps
        )
        
        # Plot the path with recalculated steering
        path_2d = []
        for i, point in enumerate(steered_points):
            # Project each steered point to 2D for visualization
            point_scaled = self.scaler.transform(point.reshape(1, -1))
            point_2d = self.projection_model.transform(point_scaled)[0]
            path_2d.append(point_2d)
            
            if i == 0:
                ax1.scatter(point_2d[0], point_2d[1], c='red', s=100, marker='o', 
                           label='Start', zorder=5)
            elif i == len(steered_points) - 1:
                ax1.scatter(point_2d[0], point_2d[1], c='blue', s=100, marker='s', 
                           label='End', zorder=5)
        
        # Plot the path
        path_2d = np.array(path_2d)
        ax1.plot(path_2d[:, 0], path_2d[:, 1], 'r-', linewidth=2, alpha=0.8, label='Steering Path')
        
        # Show intermediate points
        ax1.scatter(path_2d[1:-1, 0], path_2d[1:-1, 1], c='orange', s=40, alpha=0.7, 
                   label='Intermediate Points', zorder=4)
        
        ax1.set_xlabel('First Component')
        ax1.set_ylabel('Second Component')
        ax1.set_title(f'Steering path of a point in {self.method.upper()} space')
        ax1.legend()
        ax1.grid(True, alpha=0.3)
        
        
        plt.tight_layout()
        plt.show()
        
        return steered_points, steering_info_list