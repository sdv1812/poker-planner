import { Card, CardContent, Typography, Box } from '@mui/material';
import { AlertCircle } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gray-50">
      <Card className="w-full max-w-md mx-4">
        <CardContent className="pt-6">
          <Box display="flex" mb={4} gap={2}>
            <AlertCircle className="h-8 w-8 text-red-500" />
            <Typography variant="h5" component="h1" className="text-gray-900">
              404 Page Not Found
            </Typography>
          </Box>
          <Typography variant="body2" color="textSecondary" className="mt-4">
            Did you forget to add the page to the router?
          </Typography>
        </CardContent>
      </Card>
    </div>
  );
}
