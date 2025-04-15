const callRoutes = require('./routes/call.routes');

// ... existing middleware ...

app.use('/api', callRoutes);

// ... rest of the code ... 