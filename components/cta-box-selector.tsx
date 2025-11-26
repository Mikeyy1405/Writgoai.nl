
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { toast } from 'react-hot-toast';

interface CTABoxSelectorProps {
  open: boolean;
  onClose: () => void;
  onInsert: (shortcode: string) => void;
}

export function CTABoxSelector({ open, onClose, onInsert }: CTABoxSelectorProps) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    buttonText: 'Bekijk nu',
    buttonLink: '',
  });

  const handleInsert = () => {
    if (!formData.title || !formData.buttonLink) {
      toast.error('Titel en link zijn verplicht');
      return;
    }

    // Generate beautiful HTML CTA box
    const ctaBoxHTML = `
<!-- CTA Box: ${formData.title} -->
<div class="writgo-cta-box" style="all: initial !important; display: block !important; max-width: 800px !important; width: 100% !important; background: linear-gradient(135deg, #ff6b35 0%, #f7931e 100%) !important; border-radius: 20px !important; padding: 48px 40px !important; margin: 50px auto !important; box-shadow: 0 20px 60px rgba(255, 107, 53, 0.3) !important; text-align: center !important; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif !important; box-sizing: border-box !important; position: relative !important; overflow: hidden !important;" onmouseover="this.style.transform='translateY(-4px)'; this.style.boxShadow='0 25px 70px rgba(255, 107, 53, 0.35)'" onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 20px 60px rgba(255, 107, 53, 0.3)'">
  
  <div style="all: initial !important; display: block !important; position: absolute !important; top: -50px !important; right: -50px !important; width: 200px !important; height: 200px !important; background: rgba(255, 255, 255, 0.1) !important; border-radius: 50% !important; pointer-events: none !important;"></div>
  
  <h2 style="all: initial !important; display: block !important; margin: 0 0 16px 0 !important; padding: 0 !important; font-size: 36px !important; font-weight: 900 !important; color: #ffffff !important; line-height: 1.2 !important; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif !important; letter-spacing: -0.5px !important; position: relative !important;">${formData.title}</h2>
  
  ${formData.description ? `<p style="all: initial !important; display: block !important; margin: 0 0 32px 0 !important; padding: 0 !important; font-size: 18px !important; line-height: 1.6 !important; color: rgba(255, 255, 255, 0.95) !important; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif !important; font-weight: 400 !important; position: relative !important;">${formData.description}</p>` : '<div style="margin-bottom: 24px"></div>'}
  
  <a href="${formData.buttonLink}" target="_blank" rel="noopener noreferrer" style="all: initial !important; display: inline-flex !important; align-items: center !important; justify-content: center !important; padding: 18px 48px !important; background: #ffffff !important; color: #ff6b35 !important; font-size: 18px !important; font-weight: 800 !important; border-radius: 12px !important; text-decoration: none !important; transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important; cursor: pointer !important; box-sizing: border-box !important; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif !important; line-height: 1 !important; box-shadow: 0 8px 20px rgba(0, 0, 0, 0.15) !important; gap: 12px !important; position: relative !important;" onmouseover="this.style.background='#fef3c7'; this.style.transform='translateY(-3px)'; this.style.boxShadow='0 12px 28px rgba(0, 0, 0, 0.2)'" onmouseout="this.style.background='#ffffff'; this.style.transform='translateY(0)'; this.style.boxShadow='0 8px 20px rgba(0, 0, 0, 0.15)'">
    <span style="all: initial !important; display: inline-block !important; color: #ff6b35 !important; font-size: 18px !important; font-weight: 800 !important; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif !important; line-height: 1 !important;">${formData.buttonText}</span>
    <svg style="all: initial !important; display: inline-block !important; width: 20px !important; height: 20px !important; fill: currentColor !important; flex-shrink: 0 !important;" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
      <path fill-rule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clip-rule="evenodd"></path>
    </svg>
  </a>
</div>
<!-- End CTA Box -->
    `.trim();

    onInsert(ctaBoxHTML);
    onClose();
    toast.success('CTA box toegevoegd');
    
    // Reset form
    setFormData({
      title: '',
      description: '',
      buttonText: 'Bekijk nu',
      buttonLink: '',
    });
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg bg-gray-900 border-gray-800">
        <DialogHeader>
          <DialogTitle className="text-white">CTA Box Toevoegen</DialogTitle>
          <DialogDescription className="text-gray-400">
            Maak een call-to-action box met een knop
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label className="text-gray-300">Titel *</Label>
            <Input
              placeholder="Bijv: Ontdek de beste producten"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="bg-gray-800 border-gray-700 text-white"
            />
          </div>

          <div>
            <Label className="text-gray-300">Beschrijving</Label>
            <Textarea
              placeholder="Korte beschrijving (optioneel)"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="bg-gray-800 border-gray-700 text-white"
              rows={3}
            />
          </div>

          <div>
            <Label className="text-gray-300">Button Text</Label>
            <Input
              placeholder="Bijv: Bekijk nu"
              value={formData.buttonText}
              onChange={(e) => setFormData({ ...formData, buttonText: e.target.value })}
              className="bg-gray-800 border-gray-700 text-white"
            />
          </div>

          <div>
            <Label className="text-gray-300">Button Link *</Label>
            <Input
              placeholder="https://..."
              value={formData.buttonLink}
              onChange={(e) => setFormData({ ...formData, buttonLink: e.target.value })}
              className="bg-gray-800 border-gray-700 text-white"
            />
          </div>
        </div>

        <DialogFooter>
          <Button 
            variant="outline" 
            onClick={onClose}
            className="border-gray-700 text-gray-300"
          >
            Annuleren
          </Button>
          <Button 
            onClick={handleInsert}
            className="bg-orange-600 hover:bg-orange-700"
          >
            Toevoegen
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
