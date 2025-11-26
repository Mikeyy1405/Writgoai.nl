
'use client';

import { useState } from 'react';
import { FileText, List, Star, GitCompare, BookOpen, TrendingUp, ChevronDown, ChevronUp, ShoppingCart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';

interface ContentTemplate {
  id: string;
  name: string;
  icon: any;
  description: string;
  prompt: (data: any) => string;
  fields: {
    name: string;
    label: string;
    type: 'text' | 'textarea' | 'number' | 'checkbox';
    placeholder?: string;
    required?: boolean;
    description?: string;
  }[];
  supportsBolcomProducts?: boolean; // Template ondersteunt automatische producten
}

const templates: ContentTemplate[] = [
  {
    id: 'top-10',
    name: 'Top 10 Beste',
    icon: List,
    description: 'Maak een top 10 lijst van beste producten of diensten',
    supportsBolcomProducts: true,
    fields: [
      {
        name: 'onderwerp',
        label: 'Onderwerp',
        type: 'text',
        placeholder: 'bijv. "laptops voor studenten"',
        required: true,
      },
      {
        name: 'doelgroep',
        label: 'Doelgroep',
        type: 'text',
        placeholder: 'bijv. "studenten", "professionals"',
      },
      {
        name: 'budget',
        label: 'Budget (optioneel)',
        type: 'text',
        placeholder: 'bijv. "onder €500"',
      },
      {
        name: 'includeBolcomProducts',
        label: 'Automatisch Bol.com producten toevoegen',
        type: 'checkbox',
        description: '🛒 Voeg automatisch de beste Bol.com producten toe met actuele prijzen',
      },
    ],
    prompt: (data) => `Schrijf een uitgebreide en informatieve "Top 10 Beste ${data.onderwerp}" artikel voor ${data.doelgroep || 'de lezer'}${data.budget ? ` met een budget ${data.budget}` : ''}.

Structuur:
1. Inleiding (waarom dit onderwerp belangrijk is)
2. Voor elk van de 10 items:
   - Titel met rangnummer
   - Korte beschrijving
   - Voor- en nadelen
   - Beste gebruik scenario
   - Prijs indicatie
3. Vergelijkingstabel
4. Conclusie en aanbeveling

Maak de content:
- SEO-geoptimaliseerd
- Informatief en eerlijk
- Met duidelijke koopadvies
- Inclusief actuele prijzen (schatting)
- Met praktische tips`,
  },
  {
    id: 'product-review',
    name: 'Product Review',
    icon: Star,
    description: 'Schrijf een uitgebreide productreview',
    supportsBolcomProducts: true,
    fields: [
      {
        name: 'product',
        label: 'Productnaam',
        type: 'text',
        placeholder: 'bijv. "iPhone 15 Pro"',
        required: true,
      },
      {
        name: 'categorie',
        label: 'Categorie',
        type: 'text',
        placeholder: 'bijv. "smartphones"',
      },
      {
        name: 'focuspunten',
        label: 'Belangrijkste focuspunten',
        type: 'textarea',
        placeholder: 'bijv. "camera kwaliteit, batterijduur, design"',
      },
      {
        name: 'includeBolcomProducts',
        label: 'Automatisch Bol.com producten toevoegen',
        type: 'checkbox',
        description: '🛒 Voeg automatisch vergelijkbare Bol.com producten toe met actuele prijzen',
      },
    ],
    prompt: (data) => `Schrijf een professionele en eerlijke review van ${data.product}${data.categorie ? ` in de ${data.categorie} categorie` : ''}.

Structuur:
1. Inleiding
   - Korte intro over het product
   - Voor wie is dit product geschikt?
   
2. Specificaties en features
   - Technische details
   - Belangrijkste kenmerken
   
3. Design en build quality
   
4. Performance en gebruikservaring
   ${data.focuspunten ? `- Focus op: ${data.focuspunten}` : ''}
   
5. Voor- en nadelen
   - Sterke punten
   - Verbeterpunten
   
6. Prijs-kwaliteit verhouding
   
7. Vergelijking met alternatieven
   
8. Eindoordeel en cijfer (uit 10)
   
9. Conclusie: Voor wie is dit product aan te raden?

Maak de review:
- Objectief en eerlijk
- Met praktijkvoorbeelden
- SEO-geoptimaliseerd
- Inclusief koopadvies`,
  },
  {
    id: 'comparison',
    name: 'Vergelijking',
    icon: GitCompare,
    description: 'Vergelijk 2 of meer producten/diensten',
    fields: [
      {
        name: 'items',
        label: 'Items om te vergelijken (gescheiden door komma)',
        type: 'textarea',
        placeholder: 'bijv. "iPhone 15 Pro, Samsung Galaxy S24, Google Pixel 8"',
        required: true,
      },
      {
        name: 'criteria',
        label: 'Vergelijkingscriteria (gescheiden door komma)',
        type: 'textarea',
        placeholder: 'bijv. "prijs, camera, batterijduur, design"',
      },
    ],
    prompt: (data) => `Schrijf een uitgebreide vergelijking tussen: ${data.items}

Structuur:
1. Inleiding
   - Waarom deze vergelijking?
   - Voor wie is dit relevant?
   
2. Overzicht per product
   - Korte intro van elk product
   - Belangrijkste specs
   
3. Gedetailleerde vergelijking
   ${data.criteria ? `Focus op: ${data.criteria}` : 'Focus op: prijs, kwaliteit, features, gebruiksgemak'}
   
4. Vergelijkingstabel
   - Overzichtelijke tabel met alle criteria
   - Scores per criterium
   
5. Prijs-kwaliteit verhouding
   
6. Voor wie is welk product het beste?
   - Per doelgroep/gebruik scenario
   
7. Eindconclusie
   - Winnaar per categorie
   - Algemene aanbeveling

Maak de vergelijking:
- Objectief en eerlijk
- Met duidelijke tabel
- SEO-geoptimaliseerd
- Inclusief koopadvies per doelgroep`,
  },
  {
    id: 'how-to',
    name: 'How-to Gids',
    icon: BookOpen,
    description: 'Stap-voor-stap tutorial of handleiding',
    supportsBolcomProducts: true,
    fields: [
      {
        name: 'onderwerp',
        label: 'Onderwerp',
        type: 'text',
        placeholder: 'bijv. "WordPress installeren"',
        required: true,
      },
      {
        name: 'niveau',
        label: 'Niveau',
        type: 'text',
        placeholder: 'bijv. "beginners", "gevorderden"',
      },
      {
        name: 'doel',
        label: 'Einddoel',
        type: 'textarea',
        placeholder: 'Wat moet de lezer kunnen na deze tutorial?',
      },
      {
        name: 'includeBolcomProducts',
        label: 'Automatisch Bol.com producten toevoegen',
        type: 'checkbox',
        description: '🛒 Voeg automatisch aanbevolen Bol.com producten/tools toe',
      },
    ],
    prompt: (data) => `Schrijf een complete stap-voor-stap handleiding voor: ${data.onderwerp}

Doelgroep: ${data.niveau || 'beginners'}
${data.doel ? `Einddoel: ${data.doel}` : ''}

Structuur:
1. Inleiding
   - Wat ga je leren?
   - Wat heb je nodig?
   - Geschatte tijdsduur
   
2. Voorbereiding
   - Benodigde tools/materialen
   - Vereiste voorkennis
   
3. Stap-voor-stap instructies
   - Duidelijk genummerde stappen
   - Screenshots/voorbeelden waar nodig
   - Tips en waarschuwingen
   
4. Veelvoorkomende problemen en oplossingen
   
5. Tips voor gevorderden
   
6. Conclusie en volgende stappen

Maak de gids:
- Zeer gedetailleerd
- Met praktische voorbeelden
- SEO-geoptimaliseerd
- Voor ${data.niveau || 'beginners'} begrijpelijk`,
  },
  {
    id: 'trend-article',
    name: 'Trend Artikel',
    icon: TrendingUp,
    description: 'Schrijf over actuele trends en ontwikkelingen',
    fields: [
      {
        name: 'trend',
        label: 'Trend/Onderwerp',
        type: 'text',
        placeholder: 'bijv. "AI in marketing"',
        required: true,
      },
      {
        name: 'industrie',
        label: 'Industrie/Sector',
        type: 'text',
        placeholder: 'bijv. "e-commerce"',
      },
      {
        name: 'perspectief',
        label: 'Perspectief (optioneel)',
        type: 'text',
        placeholder: 'bijv. "voor kleine bedrijven"',
      },
    ],
    prompt: (data) => `Schrijf een informatief en actueel artikel over de trend: ${data.trend}${data.industrie ? ` in de ${data.industrie} sector` : ''}${data.perspectief ? `, ${data.perspectief}` : ''}

Structuur:
1. Inleiding
   - Wat is deze trend?
   - Waarom is het relevant?
   
2. Achtergrond en context
   - Hoe is deze trend ontstaan?
   - Belangrijkste ontwikkelingen
   
3. Huidige situatie
   - Stand van zaken
   - Belangrijkste spelers/voorbeelden
   
4. Impact en implicaties
   - Voor bedrijven
   - Voor consumenten
   - Voor de sector
   
5. Kansen en uitdagingen
   
6. Toekomstverwachtingen
   - Wat kunnen we verwachten?
   - Expert predictions
   
7. Praktische tips
   - Hoe kun je hierop inspelen?
   - Wat moet je doen?
   
8. Conclusie

Maak het artikel:
- Actueel en informatief
- Met concrete voorbeelden
- SEO-geoptimaliseerd
- Actionable insights`,
  },
];

interface ContentTemplatesProps {
  onSelectTemplate: (prompt: string, options?: { 
    templateId?: string; 
    includeBolcomProducts?: boolean;
    searchQuery?: string;
  }) => void;
}

export function ContentTemplates({ onSelectTemplate }: ContentTemplatesProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<ContentTemplate | null>(null);
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [showAllTemplates, setShowAllTemplates] = useState(false);

  const handleOpenTemplate = (template: ContentTemplate) => {
    setSelectedTemplate(template);
    setFormData({});
    setDialogOpen(true);
  };

  const handleSubmit = () => {
    if (!selectedTemplate) return;

    // Validate required fields
    const missingFields = selectedTemplate.fields
      .filter((field) => field.required && !formData[field.name])
      .map((field) => field.label);

    if (missingFields.length > 0) {
      alert(`Vul de volgende verplichte velden in: ${missingFields.join(', ')}`);
      return;
    }

    const prompt = selectedTemplate.prompt(formData);
    
    // Prepare options for Bol.com product integration
    const options: { 
      templateId?: string; 
      includeBolcomProducts?: boolean;
      searchQuery?: string;
    } = {
      templateId: selectedTemplate.id,
      includeBolcomProducts: formData.includeBolcomProducts === 'true',
    };

    // Extract search query based on template type
    if (options.includeBolcomProducts) {
      if (selectedTemplate.id === 'top-10') {
        options.searchQuery = formData.onderwerp || '';
      } else if (selectedTemplate.id === 'product-review') {
        options.searchQuery = formData.product || '';
      } else if (selectedTemplate.id === 'how-to') {
        options.searchQuery = formData.onderwerp || '';
      }
    }

    onSelectTemplate(prompt, options);
    setDialogOpen(false);
    setSelectedTemplate(null);
    setFormData({});
  };

  const displayedTemplates = showAllTemplates ? templates : templates.slice(0, 3);

  return (
    <>
      {/* Quick Templates Bar */}
      <div className="bg-gradient-to-r from-orange-50 to-orange-100 dark:from-orange-950/30 dark:to-orange-900/20 p-3 rounded-lg border border-orange-200 dark:border-orange-800">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-orange-600" />
            <h3 className="text-sm font-semibold text-orange-900 dark:text-orange-100">
              Content Templates
            </h3>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowAllTemplates(!showAllTemplates)}
            className="h-6 text-xs text-orange-700 hover:text-orange-900"
          >
            {showAllTemplates ? (
              <>
                <ChevronUp className="w-3 h-3 mr-1" />
                Minder
              </>
            ) : (
              <>
                <ChevronDown className="w-3 h-3 mr-1" />
                Meer ({templates.length - 3})
              </>
            )}
          </Button>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
          {displayedTemplates.map((template) => {
            const Icon = template.icon;
            return (
              <Button
                key={template.id}
                variant="outline"
                size="sm"
                onClick={() => handleOpenTemplate(template)}
                className="h-auto py-2 px-3 text-left justify-start bg-white dark:bg-gray-900 hover:bg-orange-50 dark:hover:bg-orange-950/50 border-orange-200 dark:border-orange-800"
              >
                <Icon className="w-4 h-4 mr-2 text-orange-600 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-medium text-gray-900 dark:text-gray-100 truncate">
                    {template.name}
                  </div>
                  <div className="text-[10px] text-gray-500 dark:text-gray-400 truncate">
                    {template.description}
                  </div>
                </div>
              </Button>
            );
          })}
        </div>
      </div>

      {/* Template Form Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {selectedTemplate && (
                <>
                  <selectedTemplate.icon className="w-5 h-5 text-orange-600" />
                  {selectedTemplate.name}
                </>
              )}
            </DialogTitle>
            <DialogDescription>
              {selectedTemplate?.description}
            </DialogDescription>
          </DialogHeader>

          {selectedTemplate && (
            <div className="space-y-4 py-4">
              {selectedTemplate.fields.map((field) => (
                <div key={field.name} className="space-y-2">
                  {field.type === 'checkbox' ? (
                    <div className="flex items-start space-x-3 rounded-lg border border-orange-200 dark:border-orange-800 bg-orange-50 dark:bg-orange-950/30 p-3">
                      <Checkbox
                        id={field.name}
                        checked={formData[field.name] === 'true'}
                        onCheckedChange={(checked) =>
                          setFormData({ ...formData, [field.name]: checked ? 'true' : 'false' })
                        }
                        className="mt-1"
                      />
                      <div className="flex-1">
                        <Label 
                          htmlFor={field.name}
                          className="text-sm font-medium cursor-pointer"
                        >
                          {field.label}
                        </Label>
                        {field.description && (
                          <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                            {field.description}
                          </p>
                        )}
                      </div>
                    </div>
                  ) : (
                    <>
                      <Label htmlFor={field.name}>
                        {field.label}
                        {field.required && <span className="text-red-500 ml-1">*</span>}
                      </Label>
                      {field.type === 'textarea' ? (
                        <Textarea
                          id={field.name}
                          placeholder={field.placeholder}
                          value={formData[field.name] || ''}
                          onChange={(e) =>
                            setFormData({ ...formData, [field.name]: e.target.value })
                          }
                          className="min-h-[80px]"
                        />
                      ) : (
                        <Input
                          id={field.name}
                          type={field.type}
                          placeholder={field.placeholder}
                          value={formData[field.name] || ''}
                          onChange={(e) =>
                            setFormData({ ...formData, [field.name]: e.target.value })
                          }
                        />
                      )}
                    </>
                  )}
                </div>
              ))}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Annuleren
            </Button>
            <Button
              onClick={handleSubmit}
              className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700"
            >
              Genereer Content
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
