import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Building2, Home, Check } from 'lucide-react';

interface RoleSelectionDialogProps {
  open: boolean;
  onRoleSelect: (role: 'buyer' | 'builder') => Promise<void>;
}

const RoleSelectionDialog: React.FC<RoleSelectionDialogProps> = ({ open, onRoleSelect }) => {
  const [selectedRole, setSelectedRole] = useState<'buyer' | 'builder' | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!selectedRole) return;

    setIsSubmitting(true);
    try {
      await onRoleSelect(selectedRole);
    } catch (error) {
      console.error('Error selecting role:', error);
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-[600px]" onInteractOutside={(e) => e.preventDefault()} onEscapeKeyDown={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-center">
            Welcome to ApnaGhar! 🏠
          </DialogTitle>
          <DialogDescription className="text-center text-base">
            Please select your role to personalize your experience
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
          {/* Buyer Card */}
          <Card
            className={`relative cursor-pointer transition-all duration-200 p-6 hover:shadow-lg ${
              selectedRole === 'buyer'
                ? 'border-2 border-primary shadow-lg'
                : 'border border-border'
            }`}
            onClick={() => setSelectedRole('buyer')}
          >
            {selectedRole === 'buyer' && (
              <div className="absolute top-3 right-3 bg-primary text-primary-foreground rounded-full p-1">
                <Check className="h-4 w-4" />
              </div>
            )}
            <div className="flex flex-col items-center text-center space-y-4">
              <div className={`p-4 rounded-full ${selectedRole === 'buyer' ? 'bg-primary' : 'bg-primary/10'}`}>
                <Home className={`h-8 w-8 ${selectedRole === 'buyer' ? 'text-primary-foreground' : 'text-primary'}`} />
              </div>
              <div>
                <h3 className="text-xl font-bold mb-2">I'm a Buyer</h3>
                <p className="text-sm text-muted-foreground">
                  Looking to invest in or purchase verified real estate properties
                </p>
              </div>
              <ul className="text-sm text-left space-y-2 w-full">
                <li className="flex items-start">
                  <span className="text-primary mr-2">✓</span>
                  <span>Browse verified projects</span>
                </li>
                <li className="flex items-start">
                  <span className="text-primary mr-2">✓</span>
                  <span>Track construction progress</span>
                </li>
                <li className="flex items-start">
                  <span className="text-primary mr-2">✓</span>
                  <span>Access detailed analytics</span>
                </li>
              </ul>
            </div>
          </Card>

          {/* Builder Card */}
          <Card
            className={`relative cursor-pointer transition-all duration-200 p-6 hover:shadow-lg ${
              selectedRole === 'builder'
                ? 'border-2 border-primary shadow-lg'
                : 'border border-border'
            }`}
            onClick={() => setSelectedRole('builder')}
          >
            {selectedRole === 'builder' && (
              <div className="absolute top-3 right-3 bg-primary text-primary-foreground rounded-full p-1">
                <Check className="h-4 w-4" />
              </div>
            )}
            <div className="flex flex-col items-center text-center space-y-4">
              <div className={`p-4 rounded-full ${selectedRole === 'builder' ? 'bg-primary' : 'bg-primary/10'}`}>
                <Building2 className={`h-8 w-8 ${selectedRole === 'builder' ? 'text-primary-foreground' : 'text-primary'}`} />
              </div>
              <div>
                <h3 className="text-xl font-bold mb-2">I'm a Builder</h3>
                <p className="text-sm text-muted-foreground">
                  Want to list and manage my construction projects
                </p>
              </div>
              <ul className="text-sm text-left space-y-2 w-full">
                <li className="flex items-start">
                  <span className="text-primary mr-2">✓</span>
                  <span>List your projects</span>
                </li>
                <li className="flex items-start">
                  <span className="text-primary mr-2">✓</span>
                  <span>Update milestones</span>
                </li>
                <li className="flex items-start">
                  <span className="text-primary mr-2">✓</span>
                  <span>Connect with buyers</span>
                </li>
              </ul>
            </div>
          </Card>
        </div>

        <div className="flex justify-center mt-6">
          <Button
            onClick={handleSubmit}
            disabled={!selectedRole || isSubmitting}
            className="w-full md:w-auto px-8"
            size="lg"
          >
            {isSubmitting ? 'Setting up your account...' : 'Continue'}
          </Button>
        </div>

        <p className="text-xs text-center text-muted-foreground mt-4">
          Don't worry, you can change this later in your profile settings
        </p>
      </DialogContent>
    </Dialog>
  );
};

export default RoleSelectionDialog;
