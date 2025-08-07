const { google } = require('googleapis');
const fs = require('fs').promises;
const path = require('path');

// OAuth2 configuration
const CREDENTIALS_PATH = path.join(__dirname, '..', 'client_secret_356082360584-iu40ahmgmttsrlsd39o7bd9aga4njoil.apps.googleusercontent.com.json');
const SCOPES = ['https://www.googleapis.com/auth/presentations', 'https://www.googleapis.com/auth/drive.file'];

// Load OAuth2 credentials
let oauth2Client = null;

async function initializeGoogleAuth() {
  try {
    const credentialsData = await fs.readFile(CREDENTIALS_PATH, 'utf-8');
    const credentials = JSON.parse(credentialsData);
    
    oauth2Client = new google.auth.OAuth2(
      credentials.web.client_id,
      credentials.web.client_secret,
      'http://localhost:3000/auth/callback'
    );
    
    return oauth2Client;
  } catch (error) {
    console.error('Error initializing Google Auth:', error);
    return null;
  }
}

const slidesController = {
  // Get Google OAuth URL for authentication
  getAuthUrl: async (req, res) => {
    try {
      const auth = await initializeGoogleAuth();
      if (!auth) {
        return res.status(500).json({ error: 'Failed to initialize Google Auth' });
      }

      const authUrl = auth.generateAuthUrl({
        access_type: 'offline',
        scope: SCOPES,
        prompt: 'consent'
      });

      res.json({
        success: true,
        authUrl: authUrl,
        message: 'Please visit this URL to authorize the application'
      });
    } catch (error) {
      console.error('Error generating auth URL:', error);
      res.status(500).json({ error: 'Failed to generate auth URL' });
    }
  },

  // Handle OAuth callback
  handleAuthCallback: async (req, res) => {
    try {
      const { code } = req.query;
      if (!code) {
        return res.status(400).json({ error: 'Authorization code not provided' });
      }

      const auth = await initializeGoogleAuth();
      if (!auth) {
        return res.status(500).json({ error: 'Failed to initialize Google Auth' });
      }

      const { tokens } = await auth.getToken(code);
      auth.setCredentials(tokens);

      // Store tokens in session or database (for demo, we'll use memory)
      oauth2Client = auth;

      res.json({
        success: true,
        message: 'Authentication successful! You can now create Google Slides.',
        authenticated: true
      });
    } catch (error) {
      console.error('Error handling auth callback:', error);
      res.status(500).json({ error: 'Authentication failed' });
    }
  },

  // Create a new Google Slide presentation
  createSlide: async (req, res) => {
    try {
      const { title, content, layout = 'TITLE_AND_BODY', theme = 'default' } = req.body;
      
      // Input validation
      if (!title || !content) {
        return res.status(400).json({ error: 'Title and content are required' });
      }

      // Check if user is authenticated
      if (!oauth2Client || !oauth2Client.credentials.access_token) {
        return res.status(401).json({ 
          error: 'Authentication required',
          needsAuth: true,
          message: 'Please authenticate with Google first'
        });
      }

      try {
        // Create actual Google Slide
        const slideData = await createActualGoogleSlide(title, content, layout, theme);
        
        res.status(201).json({
          success: true,
          message: 'Google Slide created successfully',
          data: slideData
        });
      } catch (authError) {
        if (authError.code === 401) {
          return res.status(401).json({ 
            error: 'Authentication expired',
            needsAuth: true,
            message: 'Please re-authenticate with Google'
          });
        }
        throw authError;
      }

    } catch (error) {
      console.error('Error creating Google Slide:', error);
      res.status(500).json({ error: 'Failed to create Google Slide' });
    }
  },

  // Get slide creation status (for future use)
  getSlideStatus: async (req, res) => {
    try {
      const { id } = req.params;
      
      res.json({
        success: true,
        data: {
          id: id,
          status: 'created',
          url: `https://docs.google.com/presentation/d/${id}/edit`
        }
      });
    } catch (error) {
      console.error('Error getting slide status:', error);
      res.status(500).json({ error: 'Failed to get slide status' });
    }
  },

  // Setup instructions for Google API
  getSetupInstructions: async (req, res) => {
    try {
      const instructions = {
        message: 'Google Slides API Setup Instructions',
        steps: [
          '1. Go to Google Cloud Console (https://console.cloud.google.com/)',
          '2. Create a new project or select existing one',
          '3. Enable Google Slides API',
          '4. Create credentials (Service Account)',
          '5. Download the JSON key file',
          '6. Set GOOGLE_APPLICATION_CREDENTIALS environment variable',
          '7. Grant necessary permissions to the service account'
        ],
        currentStatus: 'Demo mode - using mock responses',
        documentation: 'https://developers.google.com/slides/api/quickstart/nodejs'
      };

      res.json({
        success: true,
        data: instructions
      });
    } catch (error) {
      console.error('Error getting setup instructions:', error);
      res.status(500).json({ error: 'Failed to get setup instructions' });
    }
  }
};

// Create actual Google Slide using OAuth authentication
async function createActualGoogleSlide(title, content, layout, theme) {
  try {
    if (!oauth2Client) {
      throw new Error('OAuth client not initialized');
    }

    const slides = google.slides({ version: 'v1', auth: oauth2Client });

    // Create presentation
    const presentation = await slides.presentations.create({
      resource: {
        title: title
      }
    });

    const presentationId = presentation.data.presentationId;

    // Get the first slide to modify
    const getResponse = await slides.presentations.get({
      presentationId: presentationId
    });

    const firstSlide = getResponse.data.slides[0];
    const titleElementId = firstSlide.pageElements.find(
      element => element.shape && element.shape.placeholder && 
      element.shape.placeholder.type === 'TITLE'
    )?.objectId;

    const bodyElementId = firstSlide.pageElements.find(
      element => element.shape && element.shape.placeholder && 
      element.shape.placeholder.type === 'BODY'
    )?.objectId;

    // Prepare batch update requests
    const requests = [];

    // Update title if title element exists
    if (titleElementId) {
      requests.push({
        insertText: {
          objectId: titleElementId,
          text: title,
          insertionIndex: 0
        }
      });
    }

    // Update body content if body element exists
    if (bodyElementId) {
      requests.push({
        insertText: {
          objectId: bodyElementId,
          text: content,
          insertionIndex: 0
        }
      });
    }

    // Apply the updates if we have any
    if (requests.length > 0) {
      await slides.presentations.batchUpdate({
        presentationId: presentationId,
        resource: {
          requests: requests
        }
      });
    }

    return {
      id: presentationId,
      title: title,
      url: `https://docs.google.com/presentation/d/${presentationId}/edit`,
      created: new Date().toISOString(),
      layout: layout,
      theme: theme
    };

  } catch (error) {
    console.error('Error creating Google Slide:', error);
    throw error;
  }
}

module.exports = slidesController;