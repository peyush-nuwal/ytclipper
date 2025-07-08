import { useAuth0 } from '@auth0/auth0-react';
import {
  Button,
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardDescription,
} from '@ytclipper/ui';

import Loading from './components/loading';
import LoginButton from './components/login-button';
import LogoutButton from './components/logout-button';
import UserProfile from './components/user-profile';

function App() {
  const { isLoading, error, isAuthenticated, user } = useAuth0();

  console.log('Auth State:', { isLoading, error, isAuthenticated, user });

  if (error) {

    console.error('Auth0 Error:', error);
    return (
      <div className="p-8">
        <Card className="max-w-md mx-auto">
          <CardHeader>
            <CardTitle className="text-red-600">Authentication Error</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-red-600">{error.message}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isLoading) {
    return <Loading />;
  }

  return (
    <div className='p-8 space-y-6 max-w-4xl mx-auto'>
      <div className="flex justify-between items-center">
        <h1 className='text-3xl font-bold text-foreground'>YT Clipper</h1>
        <div className="flex space-x-2">
          <LoginButton />
          <LogoutButton />
        </div>
      </div>

      <div className='test-class'>
        This should have red background if Tailwind is working
      </div>

      {/* Show different content based on authentication status */}
      {isAuthenticated ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* User Profile */}
          <UserProfile />

          {/* App Features */}
          <Card>
            <CardHeader>
              <CardTitle>Welcome Back!</CardTitle>
              <CardDescription>
                You are now logged in and can access all features
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-2">
                <h4 className="font-semibold">Available Features:</h4>
                <ul className="list-disc list-inside space-y-1 text-sm text-gray-600">
                  <li>Create and manage video clips</li>
                  <li>Share clips with others</li>
                  <li>Access your clip history</li>
                  <li>Export clips in various formats</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>
      ) : (
        <div className="text-center space-y-6">
          <Card className="max-w-md mx-auto">
            <CardHeader>
              <CardTitle>Welcome to YT Clipper</CardTitle>
              <CardDescription>
                Please log in to access your account and start creating clips
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <h4 className="font-semibold">Features you'll get access to:</h4>
                <ul className="list-disc list-inside space-y-1 text-sm text-gray-600">
                  <li>Create video clips from YouTube</li>
                  <li>Save and organize your clips</li>
                  <li>Share clips with friends</li>
                  <li>Download clips for offline use</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <Card className='max-w-md mx-auto'>
        <CardHeader>
          <CardTitle>Shared UI Components</CardTitle>
          <CardDescription>
            Components from @ytclipper/ui package that can be used across all
            apps
          </CardDescription>
        </CardHeader>
        <CardContent className='space-y-3'>
          <div className='space-x-2'>
            <Button>Default Button</Button>
            <Button variant='secondary'>Secondary</Button>
          </div>
          <div className='space-x-2'>
            <Button variant='outline'>Outline Button</Button>
            <Button variant='destructive'>Destructive</Button>
          </div>
          <div className='space-x-2'>
            <Button size='sm'>Small Button</Button>
            <Button size='lg'>Large Button</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default App;
