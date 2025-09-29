# NQS D3 Dashboard

A modern, interactive D3.js dashboard for visualizing Qualoo Network Quality Score (NQS) benchmarking data. This dashboard provides comprehensive insights into network performance metrics, geographic distribution, and real-time analytics.

## Features

- **Real-time Performance Metrics**: Live updates of latency, jitter, and packet loss statistics
- **Interactive World Map**: Geographic visualization of network performance across countries
- **Network Performance Charts**: Comparative analysis of different network types (mobile, WiFi, wired)
- **Time Series Analysis**: Historical performance trends over time
- **Top Performers Table**: Best performing network routes and connections
- **Responsive Design**: Optimized for desktop and mobile devices
- **Modern UI**: Clean, professional interface with smooth animations

## Technology Stack

- **Frontend**: D3.js v7, HTML5, CSS3, JavaScript ES6+
- **Backend**: Node.js, Express.js
- **Database**: PostgreSQL
- **Build Tool**: Webpack 5
- **Styling**: Custom CSS with modern design patterns

## Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd nqs-d3-dashboard
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   Create a `.env` file in the root directory:
   ```env
   PORT=8001
   DB_USER=postgres
   DB_HOST=localhost
   DB_NAME=postgres
   DB_PASSWORD=your_password
   DB_PORT=5501
   NODE_ENV=development
   ```

4. **Start the development server**
   ```bash
   npm run dev
   ```

5. **Build for production**
   ```bash
   npm run build
   ```

## API Endpoints

The dashboard connects to the following API endpoints:

- `GET /api/nqs/performance-metrics` - Get performance metrics data
- `GET /api/nqs/geographic-distribution` - Get geographic distribution data
- `GET /api/nqs/network-performance` - Get network performance by type
- `GET /api/nqs/time-series` - Get time series data
- `GET /api/nqs/top-performers` - Get top performing routes
- `GET /api/latency-data` - Get raw latency data (compatibility)

## Project Structure

```
nqs-d3-dashboard/
├── app.js                 # Main application logic
├── server.js             # Express server with API endpoints
├── index.html            # Main HTML template
├── styles.css            # CSS styles
├── package.json          # Dependencies and scripts
├── webpack.config.js     # Webpack configuration
├── README.md            # Project documentation
└── .env                 # Environment variables (create this)
```

## D3.js Visualizations

### 1. World Map
- Interactive choropleth map showing performance by country
- Color-coded based on average latency
- Hover tooltips with detailed metrics

### 2. Network Performance Chart
- Bar chart comparing different network types
- Shows average latency, jitter, and packet loss
- Interactive hover effects

### 3. Time Series Chart
- Line chart showing performance trends over time
- Hourly aggregation of metrics
- Smooth animations and transitions

### 4. Distribution Chart
- Histogram showing latency distribution
- Helps identify performance patterns
- Interactive bin selection

### 5. Top Performers Table
- Sortable table of best performing routes
- Color-coded performance indicators
- Real-time updates

## Configuration

### Database Connection
The application connects to a PostgreSQL database with the following tables:
- `PingTaskResults` - Main latency test results
- `PingTestHosts` - Destination host information
- `NetworkInfoExtended` - Network type and operator data
- `LocationInfo` - Geographic location data
- `IpInfo` - IP address information

### Time Range Options
- Last Hour (1 hour)
- Last 24 Hours (24 hours) - Default
- Last Week (168 hours)
- Last Month (720 hours)

## Development

### Running in Development Mode
```bash
npm run dev
```
This starts the server on port 8001 and enables hot reloading.

### Building for Production
```bash
npm run build
```
This creates optimized bundles in the `dist/` directory.

### Code Structure
- **app.js**: Main dashboard application with D3.js visualizations
- **server.js**: Express server with API endpoints and database queries
- **styles.css**: Modern CSS with responsive design
- **index.html**: HTML template with dashboard layout

## Performance Optimization

- **Lazy Loading**: D3.js modules loaded on demand
- **Data Caching**: API responses cached for better performance
- **Responsive Design**: Optimized for different screen sizes
- **Minification**: Production builds are minified and optimized

## Browser Support

- Chrome 80+
- Firefox 75+
- Safari 13+
- Edge 80+

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For support and questions, please contact the development team or create an issue in the repository.

## Changelog

### v1.0.0
- Initial release
- Basic D3.js visualizations
- Real-time data integration
- Responsive design
- Performance optimizations
