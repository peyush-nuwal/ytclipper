import { 
  
  
  Button, Card, CardHeader, CardTitle, CardContent, CardDescription } from '@ytclipper/ui'

function App() {
  return (
    <div className="p-8 space-y-6">
      <h1 className="text-3xl font-bold text-foreground">YT Clipper</h1>
<div className="test-class">
  This should have red background if Tailwind is working
</div>










      
      <Card className="max-w-md">
        <CardHeader>
          <CardTitle>Shared UI Components</CardTitle>
          <CardDescription>
            Components from @ytclipper/ui package that can be used across all apps
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-x-2">
            <Button>Default Button</Button>
            <Button variant="secondary">Secondary</Button>
          </div>
          <div className="space-x-2">
            <Button variant="outline">Outline Button</Button>
            <Button variant="destructive">Destructive</Button>
          </div>
          <div className="space-x-2">
            <Button size="sm">Small Button</Button>
            <Button size="lg">Large Button</Button>
          </div>
        </CardContent>
      </Card>

      <Card className="max-w-md">
        <CardHeader>
          <CardTitle>Features</CardTitle>
          <CardDescription>
            Benefits of the shared UI package
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li>✅ Consistent design across all apps</li>
            <li>✅ Easy to maintain and update</li>
            <li>✅ Built with shadcn/ui and Tailwind CSS</li>
            <li>✅ TypeScript support</li>
            <li>✅ Dark mode ready</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}

export default App;
