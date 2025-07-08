const Index = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-8">
      <div className="text-center space-y-6 max-w-md">
        <h1 className="text-4xl font-bold text-foreground">Welcome to Project Finance Lens</h1>
        <p className="text-xl text-foreground/80">Analysez vos données financières en toute simplicité</p>
        <div className="p-6 bg-card border border-border rounded-lg shadow-sm">
          <p className="text-card-foreground">
            Connectez d'abord Supabase pour commencer à analyser vos fichiers Excel financiers
          </p>
        </div>
      </div>
    </div>
  );
};

export default Index;
