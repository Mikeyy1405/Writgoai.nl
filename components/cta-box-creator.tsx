
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
  DialogHeader, 
  DialogTitle 
} from '@/components/ui/dialog';
import { Card } from '@/components/ui/card';
import { 
  Zap, 
  Gift, 
  TrendingUp, 
  Star, 
  AlertCircle, 
  CheckCircle,
  Info,
  Heart
} from 'lucide-react';

// CTA Box Stijlen
export const CTA_STYLES = [
  {
    id: 'gradient-orange',
    name: 'Gradient Oranje',
    icon: Zap,
    preview: {
      background: 'linear-gradient(135deg, #FF6B35 0%, #FF8C42 100%)',
      borderColor: '#FF6B35',
      textColor: '#FFFFFF',
      buttonBg: '#FFFFFF',
      buttonText: '#FF6B35'
    },
    css: `
      background: linear-gradient(135deg, #FF6B35 0%, #FF8C42 100%);
      border: 3px solid #FF6B35;
      border-radius: 12px;
      padding: 30px;
      margin: 25px 0;
      box-shadow: 0 10px 30px rgba(255, 107, 53, 0.3);
    `
  },
  {
    id: 'solid-blue',
    name: 'Blauw Modern',
    icon: TrendingUp,
    preview: {
      background: '#2563EB',
      borderColor: '#1E40AF',
      textColor: '#FFFFFF',
      buttonBg: '#FFFFFF',
      buttonText: '#2563EB'
    },
    css: `
      background: #2563EB;
      border: 3px solid #1E40AF;
      border-radius: 12px;
      padding: 30px;
      margin: 25px 0;
      box-shadow: 0 10px 30px rgba(37, 99, 235, 0.3);
    `
  },
  {
    id: 'outline-green',
    name: 'Groen Outline',
    icon: CheckCircle,
    preview: {
      background: '#F0FDF4',
      borderColor: '#22C55E',
      textColor: '#166534',
      buttonBg: '#22C55E',
      buttonText: '#FFFFFF'
    },
    css: `
      background: #F0FDF4;
      border: 3px solid #22C55E;
      border-radius: 12px;
      padding: 30px;
      margin: 25px 0;
      box-shadow: 0 4px 15px rgba(34, 197, 94, 0.2);
    `
  },
  {
    id: 'gradient-purple',
    name: 'Paars Premium',
    icon: Star,
    preview: {
      background: 'linear-gradient(135deg, #9333EA 0%, #C084FC 100%)',
      borderColor: '#9333EA',
      textColor: '#FFFFFF',
      buttonBg: '#FFFFFF',
      buttonText: '#9333EA'
    },
    css: `
      background: linear-gradient(135deg, #9333EA 0%, #C084FC 100%);
      border: 3px solid #9333EA;
      border-radius: 12px;
      padding: 30px;
      margin: 25px 0;
      box-shadow: 0 10px 30px rgba(147, 51, 234, 0.3);
    `
  },
  {
    id: 'red-alert',
    name: 'Rood Actie',
    icon: AlertCircle,
    preview: {
      background: 'linear-gradient(135deg, #DC2626 0%, #EF4444 100%)',
      borderColor: '#DC2626',
      textColor: '#FFFFFF',
      buttonBg: '#FFFFFF',
      buttonText: '#DC2626'
    },
    css: `
      background: linear-gradient(135deg, #DC2626 0%, #EF4444 100%);
      border: 3px solid #DC2626;
      border-radius: 12px;
      padding: 30px;
      margin: 25px 0;
      box-shadow: 0 10px 30px rgba(220, 38, 38, 0.3);
    `
  },
  {
    id: 'yellow-info',
    name: 'Geel Info',
    icon: Info,
    preview: {
      background: '#FEF3C7',
      borderColor: '#F59E0B',
      textColor: '#92400E',
      buttonBg: '#F59E0B',
      buttonText: '#FFFFFF'
    },
    css: `
      background: #FEF3C7;
      border: 3px solid #F59E0B;
      border-radius: 12px;
      padding: 30px;
      margin: 25px 0;
      box-shadow: 0 4px 15px rgba(245, 158, 11, 0.2);
    `
  },
  {
    id: 'pink-special',
    name: 'Roze Speciaal',
    icon: Heart,
    preview: {
      background: 'linear-gradient(135deg, #EC4899 0%, #F472B6 100%)',
      borderColor: '#EC4899',
      textColor: '#FFFFFF',
      buttonBg: '#FFFFFF',
      buttonText: '#EC4899'
    },
    css: `
      background: linear-gradient(135deg, #EC4899 0%, #F472B6 100%);
      border: 3px solid #EC4899;
      border-radius: 12px;
      padding: 30px;
      margin: 25px 0;
      box-shadow: 0 10px 30px rgba(236, 72, 153, 0.3);
    `
  },
  {
    id: 'dark-elegant',
    name: 'Donker Elegant',
    icon: Gift,
    preview: {
      background: '#1F2937',
      borderColor: '#FF6B35',
      textColor: '#FFFFFF',
      buttonBg: '#FF6B35',
      buttonText: '#FFFFFF'
    },
    css: `
      background: #1F2937;
      border: 3px solid #FF6B35;
      border-radius: 12px;
      padding: 30px;
      margin: 25px 0;
      box-shadow: 0 10px 30px rgba(31, 41, 55, 0.5);
    `
  }
];

interface CTABoxCreatorProps {
  open: boolean;
  onClose: () => void;
  onInsert: (html: string) => void;
  editMode?: boolean;
  editElement?: HTMLElement | null;
  initialConfig?: {
    title?: string;
    content?: string;
    buttonText?: string;
    buttonLink?: string;
    useCustomColors?: boolean;
    customBg?: string;
    customTextColor?: string;
    customButtonBg?: string;
    customButtonText?: string;
    styleId?: string;
  };
}

export default function CTABoxCreator({ open, onClose, onInsert, editMode = false, editElement = null, initialConfig }: CTABoxCreatorProps) {
  const [selectedStyle, setSelectedStyle] = useState(() => {
    if (initialConfig?.styleId) {
      return CTA_STYLES.find(s => s.id === initialConfig.styleId) || CTA_STYLES[0];
    }
    return CTA_STYLES[0];
  });
  const [title, setTitle] = useState(initialConfig?.title || 'Speciale Aanbieding!');
  const [content, setContent] = useState(initialConfig?.content || 'Ontdek nu onze exclusieve aanbieding en profiteer van geweldige voordelen.');
  const [buttonText, setButtonText] = useState(initialConfig?.buttonText || 'Bekijk Aanbieding');
  const [buttonLink, setButtonLink] = useState(initialConfig?.buttonLink || '');
  
  // Custom kleuren (optioneel - override preset)
  const [useCustomColors, setUseCustomColors] = useState(initialConfig?.useCustomColors || false);
  const [customBg, setCustomBg] = useState(initialConfig?.customBg || '#FF6B35');
  const [customTextColor, setCustomTextColor] = useState(initialConfig?.customTextColor || '#FFFFFF');
  const [customButtonBg, setCustomButtonBg] = useState(initialConfig?.customButtonBg || '#FFFFFF');
  const [customButtonText, setCustomButtonText] = useState(initialConfig?.customButtonText || '#FF6B35');

  const generateHTML = () => {
    const style = useCustomColors ? null : selectedStyle;
    
    // Bepaal de inline styles met !important voor WordPress/editor compatibility
    let boxStyle = '';
    let titleStyle = '';
    let contentStyle = '';
    let buttonStyle = '';
    let buttonWrapperStyle = '';
    
    if (useCustomColors) {
      // Custom kleuren - volledig inline met !important
      boxStyle = `all: initial !important; display: block !important; box-sizing: border-box !important; background: ${customBg} !important; border: 3px solid ${customBg} !important; border-radius: 12px !important; padding: 30px !important; margin: 25px 0 !important; box-shadow: 0 10px 30px rgba(0,0,0,0.2) !important; position: relative !important; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif !important;`;
      titleStyle = `all: initial !important; display: block !important; box-sizing: border-box !important; color: ${customTextColor} !important; font-size: 28px !important; font-weight: 700 !important; margin: 0 0 15px 0 !important; padding: 0 !important; text-align: center !important; line-height: 1.3 !important; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif !important;`;
      contentStyle = `all: initial !important; display: block !important; box-sizing: border-box !important; color: ${customTextColor} !important; font-size: 16px !important; line-height: 1.6 !important; margin: 0 0 25px 0 !important; padding: 0 !important; text-align: center !important; font-weight: 400 !important; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif !important;`;
      buttonWrapperStyle = `all: initial !important; display: block !important; text-align: center !important; margin: 0 !important; padding: 0 !important;`;
      buttonStyle = `all: initial !important; display: inline-block !important; box-sizing: border-box !important; background: ${customButtonBg} !important; color: ${customButtonText} !important; padding: 15px 40px !important; border-radius: 8px !important; text-decoration: none !important; font-weight: 700 !important; font-size: 18px !important; transition: transform 0.2s, box-shadow 0.2s !important; box-shadow: 0 4px 15px rgba(0,0,0,0.2) !important; cursor: pointer !important; border: none !important; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif !important; line-height: 1.2 !important;`;
    } else {
      // Preset stijl - volledig inline met !important
      const preview = style!.preview;
      const baseBg = preview.background.includes('gradient') ? preview.background : preview.background;
      
      boxStyle = `all: initial !important; display: block !important; box-sizing: border-box !important; background: ${baseBg} !important; border: 3px solid ${preview.borderColor} !important; border-radius: 12px !important; padding: 30px !important; margin: 25px 0 !important; box-shadow: 0 10px 30px rgba(0,0,0,0.2) !important; position: relative !important; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif !important;`;
      titleStyle = `all: initial !important; display: block !important; box-sizing: border-box !important; color: ${preview.textColor} !important; font-size: 28px !important; font-weight: 700 !important; margin: 0 0 15px 0 !important; padding: 0 !important; text-align: center !important; line-height: 1.3 !important; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif !important;`;
      contentStyle = `all: initial !important; display: block !important; box-sizing: border-box !important; color: ${preview.textColor} !important; font-size: 16px !important; line-height: 1.6 !important; margin: 0 0 25px 0 !important; padding: 0 !important; text-align: center !important; font-weight: 400 !important; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif !important;`;
      buttonWrapperStyle = `all: initial !important; display: block !important; text-align: center !important; margin: 0 !important; padding: 0 !important;`;
      buttonStyle = `all: initial !important; display: inline-block !important; box-sizing: border-box !important; background: ${preview.buttonBg} !important; color: ${preview.buttonText} !important; padding: 15px 40px !important; border-radius: 8px !important; text-decoration: none !important; font-weight: 700 !important; font-size: 18px !important; transition: transform 0.2s, box-shadow 0.2s !important; box-shadow: 0 4px 15px rgba(0,0,0,0.2) !important; cursor: pointer !important; border: none !important; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif !important; line-height: 1.2 !important;`;
    }

    // Bewaar configuratie in data attributes voor latere bewerking
    const config = JSON.stringify({
      title,
      content,
      buttonText,
      buttonLink,
      useCustomColors,
      customBg,
      customTextColor,
      customButtonBg,
      customButtonText,
      styleId: selectedStyle.id
    });

    // Add HTML comments for WordPress compatibility
    const html = `
<!-- Affiliate CTA Box: ${title} -->
<div class="writgo-cta-box" data-cta-config="${config.replace(/"/g, '&quot;')}" style="${boxStyle}"><h3 style="${titleStyle}">${title}</h3><p style="${contentStyle}">${content}</p><div style="${buttonWrapperStyle}"><a href="${buttonLink || '#'}" ${buttonLink ? 'target="_blank" rel="noopener noreferrer"' : ''} style="${buttonStyle}" onmouseover="this.style.transform='scale(1.05)'; this.style.boxShadow='0 6px 20px rgba(0,0,0,0.3)';" onmouseout="this.style.transform='scale(1)'; this.style.boxShadow='0 4px 15px rgba(0,0,0,0.2)';">${buttonText}</a></div></div>
<!-- End Affiliate CTA Box -->
`.trim();

    return html;
  };

  const handleInsert = () => {
    if (!title.trim()) {
      alert('Voer een titel in');
      return;
    }
    if (!content.trim()) {
      alert('Voer content in');
      return;
    }
    if (!buttonText.trim()) {
      alert('Voer button tekst in');
      return;
    }

    const html = generateHTML();
    onInsert(html);
    onClose();
    
    // Reset
    setTitle('Speciale Aanbieding!');
    setContent('Ontdek nu onze exclusieve aanbieding en profiteer van geweldige voordelen.');
    setButtonText('Bekijk Aanbieding');
    setButtonLink('');
    setUseCustomColors(false);
  };

  const currentPreview = useCustomColors 
    ? { 
        background: customBg, 
        borderColor: customBg, 
        textColor: customTextColor,
        buttonBg: customButtonBg,
        buttonText: customButtonText
      }
    : selectedStyle.preview;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">{editMode ? 'CTA Box Bewerken' : 'CTA Box Toevoegen'}</DialogTitle>
          <DialogDescription>
            Kies een stijl en pas de tekst aan voor jouw CTA box
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {/* Stijl Selectie */}
          <div>
            <Label className="text-base font-semibold mb-3 block">Kies een Stijl</Label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {CTA_STYLES.map((style) => {
                const Icon = style.icon;
                return (
                  <Card
                    key={style.id}
                    className={`cursor-pointer transition-all hover:scale-105 ${
                      !useCustomColors && selectedStyle.id === style.id
                        ? 'ring-2 ring-orange-500 shadow-lg'
                        : ''
                    }`}
                    onClick={() => {
                      setSelectedStyle(style);
                      setUseCustomColors(false);
                    }}
                  >
                    <div
                      className="h-20 rounded-t-lg flex items-center justify-center"
                      style={{
                        background: style.preview.background,
                        borderBottom: `2px solid ${style.preview.borderColor}`
                      }}
                    >
                      <Icon className="w-8 h-8" style={{ color: style.preview.textColor }} />
                    </div>
                    <div className="p-2 text-center text-sm font-medium">
                      {style.name}
                    </div>
                  </Card>
                );
              })}
            </div>
          </div>

          {/* Custom Kleuren Toggle */}
          <div>
            <Button
              variant="outline"
              onClick={() => setUseCustomColors(!useCustomColors)}
              className="w-full"
            >
              {useCustomColors ? '← Terug naar Presets' : '🎨 Custom Kleuren'}
            </Button>
          </div>

          {/* Custom Kleur Kiezers */}
          {useCustomColors && (
            <div className="grid grid-cols-2 gap-4 p-4 border rounded-lg">
              <div>
                <Label>Achtergrond</Label>
                <div className="flex gap-2">
                  <Input
                    type="color"
                    value={customBg}
                    onChange={(e) => setCustomBg(e.target.value)}
                    className="w-16 h-10"
                  />
                  <Input
                    type="text"
                    value={customBg}
                    onChange={(e) => setCustomBg(e.target.value)}
                    className="flex-1"
                  />
                </div>
              </div>
              <div>
                <Label>Tekst Kleur</Label>
                <div className="flex gap-2">
                  <Input
                    type="color"
                    value={customTextColor}
                    onChange={(e) => setCustomTextColor(e.target.value)}
                    className="w-16 h-10"
                  />
                  <Input
                    type="text"
                    value={customTextColor}
                    onChange={(e) => setCustomTextColor(e.target.value)}
                    className="flex-1"
                  />
                </div>
              </div>
              <div>
                <Label>Button Achtergrond</Label>
                <div className="flex gap-2">
                  <Input
                    type="color"
                    value={customButtonBg}
                    onChange={(e) => setCustomButtonBg(e.target.value)}
                    className="w-16 h-10"
                  />
                  <Input
                    type="text"
                    value={customButtonBg}
                    onChange={(e) => setCustomButtonBg(e.target.value)}
                    className="flex-1"
                  />
                </div>
              </div>
              <div>
                <Label>Button Tekst</Label>
                <div className="flex gap-2">
                  <Input
                    type="color"
                    value={customButtonText}
                    onChange={(e) => setCustomButtonText(e.target.value)}
                    className="w-16 h-10"
                  />
                  <Input
                    type="text"
                    value={customButtonText}
                    onChange={(e) => setCustomButtonText(e.target.value)}
                    className="flex-1"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Preview */}
          <div>
            <Label className="text-base font-semibold mb-3 block">Live Voorbeeld</Label>
            <div
              className="rounded-lg p-8"
              style={{
                background: currentPreview.background,
                border: `3px solid ${currentPreview.borderColor}`,
              }}
            >
              <h3
                className="text-2xl font-bold mb-3 text-center"
                style={{ color: currentPreview.textColor }}
              >
                {title || 'Titel komt hier'}
              </h3>
              <p
                className="mb-6 text-center"
                style={{ color: currentPreview.textColor }}
              >
                {content || 'Content komt hier'}
              </p>
              <div className="text-center">
                <span
                  className="inline-block px-8 py-3 rounded-lg font-bold"
                  style={{
                    background: currentPreview.buttonBg,
                    color: currentPreview.buttonText,
                  }}
                >
                  {buttonText || 'Button Tekst'}
                </span>
              </div>
            </div>
          </div>

          {/* Content Invoer */}
          <div className="space-y-4">
            <div>
              <Label>Titel *</Label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Bijv: Speciale Aanbieding!"
              />
            </div>

            <div>
              <Label>Content *</Label>
              <Textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Beschrijving van je aanbieding..."
                rows={3}
              />
            </div>

            <div>
              <Label>Button Tekst *</Label>
              <Input
                value={buttonText}
                onChange={(e) => setButtonText(e.target.value)}
                placeholder="Bijv: Bekijk Nu"
              />
            </div>

            <div>
              <Label>Button Link (optioneel)</Label>
              <Input
                value={buttonLink}
                onChange={(e) => setButtonLink(e.target.value)}
                placeholder="https://..."
              />
            </div>
          </div>

          {/* Acties */}
          <div className="flex gap-3 pt-4">
            <Button variant="outline" onClick={onClose} className="flex-1">
              Annuleren
            </Button>
            <Button onClick={handleInsert} className="flex-1 bg-orange-500 hover:bg-orange-600">
              CTA Box Invoegen
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
