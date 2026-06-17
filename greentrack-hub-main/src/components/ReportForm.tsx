import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, Plus, Trash2, ChevronLeft, ChevronRight, Save, Send } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { Progress } from "@/components/ui/progress";
import type { Report, ReportTab1, ReportTab2Row, ReportTab3Row, ReportTab4Row, ReportTab5Row, ReportTab6Row, ReportTab7Row, ReportTab8Row, ReportTab9Row } from "@/data/mockData";

const TAB_NAMES = [
  "Identification du projet",
  "MCL",
  "Activités",
  "Livrables",
  "Événements & Jalons",
  "Communication",
  "Réunions",
  "Contractuels",
  "Équipements",
];

interface ReportFormProps {
  projectId: string;
  projectName: string;
  chefName: string;
  acronyme?: string;
  laboratoire?: string;
  initialData?: Report;
  onSubmit: (report: Report) => void;
  onSaveDraft: () => void;
  onClose: () => void;
}

const emptyTab1 = (projectId: string, name: string, chef: string, acronyme: string, laboratoire: string): ReportTab1 => ({
  numero: projectId, intitule: name, acronyme, chefNomPrenom: chef, laboratoire, reseauxSociaux: "",
});

const uid = () => Math.random().toString(36).slice(2, 8);

const ReportForm: React.FC<ReportFormProps> = ({ projectId, projectName, chefName, acronyme = "", laboratoire = "", initialData, onSubmit, onSaveDraft, onClose }) => {
  const [currentTab, setCurrentTab] = useState(0);
  const [tab1, setTab1] = useState<ReportTab1>(initialData?.tab1 ?? emptyTab1(projectId, projectName, chefName, acronyme, laboratoire));
  const [tab2, setTab2] = useState<ReportTab2Row[]>(initialData?.tab2?.length ? initialData.tab2 : [{ id: uid(), objectifSpecifique: "", resultatsAttendus: "", activites: "", livrables: "" }]);
  const [tab3, setTab3] = useState<ReportTab3Row[]>(initialData?.tab3?.length ? initialData.tab3 : [{ id: uid(), objectifSpecifique: "", activitePrevue: "", tachesRealisees: "", etat: "En cours de préparation", avancement: 0 }]);
  const [tab4, setTab4] = useState<ReportTab4Row[]>(initialData?.tab4?.length ? initialData.tab4 : [{ id: uid(), livrable: "", description: "", type: "Publications scientifiques", statut: "En cours", dissemination: "Public" }]);
  const [tab5, setTab5] = useState<ReportTab5Row[]>(initialData?.tab5?.length ? initialData.tab5 : [{ id: uid(), intitule: "", objectifs: "", activiteCadre: "", date: "", lieu: "", publicCible: "", nombreParticipants: 0 }]);
  const [tab6, setTab6] = useState<ReportTab6Row[]>(initialData?.tab6?.length ? initialData.tab6 : [{ id: uid(), action: "", activiteConcernee: "", cible: "" }]);
  const [tab7, setTab7] = useState<ReportTab7Row[]>(initialData?.tab7?.length ? initialData.tab7 : [{ id: uid(), date: "", lieu: "", objet: "", partenaires: "" }]);
  const [tab8, setTab8] = useState<ReportTab8Row[]>(initialData?.tab8?.length ? initialData.tab8 : [{ id: uid(), nomPrenom: "", genre: "Homme", typePersonnel: "Doctorant", partenaire: "" }]);
  const [tab9, setTab9] = useState<ReportTab9Row[]>(initialData?.tab9?.length ? initialData.tab9 : [{ id: uid(), equipement: "", type: "Équipement informatique", laboratoire: "" }]);

  const handleSubmit = () => {
    const report: Report = {
      id: initialData?.id ?? `r-${uid()}`,
      projectId,
      dateSoumission: new Date().toISOString().split("T")[0],
      periodeCouvert: initialData?.periodeCouvert ?? "Janvier – Juin 2026",
      statut: "En attente",
      tab1, tab2, tab3, tab4, tab5, tab6, tab7, tab8, tab9,
    };
    onSubmit(report);
  };

  const addRow = <T,>(setter: React.Dispatch<React.SetStateAction<T[]>>, template: T) => {
    setter(prev => [...prev, { ...template, id: uid() } as T]);
  };

  const removeRow = <T extends { id: string }>(setter: React.Dispatch<React.SetStateAction<T[]>>, id: string) => {
    setter(prev => prev.filter(r => r.id !== id));
  };

  const updateRow = <T extends { id: string }>(setter: React.Dispatch<React.SetStateAction<T[]>>, id: string, field: keyof T, value: any) => {
    setter(prev => prev.map(r => r.id === id ? { ...r, [field]: value } : r));
  };

  const DatePickerField: React.FC<{ value: string; onChange: (v: string) => void }> = ({ value, onChange }) => (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !value && "text-muted-foreground")}>
          <CalendarIcon className="mr-2 h-4 w-4" />
          {value ? format(new Date(value), "PPP", { locale: fr }) : "Choisir une date"}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={value ? new Date(value) : undefined}
          onSelect={d => d && onChange(d.toISOString().split("T")[0])}
          className="p-3 pointer-events-auto"
        />
      </PopoverContent>
    </Popover>
  );

  const renderTab = () => {
    switch (currentTab) {
      case 0:
        return (
          <div className="space-y-4 animate-fade-in">
            <div className="rounded-md bg-muted/40 border px-4 py-2 text-xs text-muted-foreground mb-2">
              Les champs grisés sont renseignés automatiquement depuis votre projet et ne peuvent pas être modifiés.
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2"><Label>N°</Label><Input value={tab1.numero} disabled className="bg-muted/50 cursor-not-allowed" /></div>
              <div className="space-y-2"><Label>Acronyme</Label><Input value={tab1.acronyme} disabled className="bg-muted/50 cursor-not-allowed" /></div>
              <div className="space-y-2 md:col-span-2"><Label>Intitulé du projet</Label><Input value={tab1.intitule} disabled className="bg-muted/50 cursor-not-allowed" /></div>
              <div className="space-y-2"><Label>Nom et prénom du chef du projet</Label><Input value={tab1.chefNomPrenom} disabled className="bg-muted/50 cursor-not-allowed" /></div>
              <div className="space-y-2"><Label>Laboratoire coordinateur</Label><Input value={tab1.laboratoire} disabled className="bg-muted/50 cursor-not-allowed" /></div>
              <div className="space-y-2 md:col-span-2"><Label>Liens réseaux sociaux</Label><Textarea value={tab1.reseauxSociaux} onChange={e => setTab1({ ...tab1, reseauxSociaux: e.target.value })} rows={3} placeholder="https://..." /></div>
            </div>
          </div>
        );
      case 1:
        return (
          <div className="space-y-4 animate-fade-in">
            <p className="text-sm text-muted-foreground italic">Reprendre la matrice cadre logique telle que présentée dans la proposition soumise.</p>
            {tab2.map(row => (
              <div key={row.id} className="border rounded-lg p-4 space-y-3 relative group">
                <Button variant="ghost" size="sm" className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity text-destructive" onClick={() => removeRow(setTab2, row.id)}><Trash2 className="w-4 h-4" /></Button>
                <div className="space-y-2"><Label>Objectifs Spécifiques (OS)</Label><Input value={row.objectifSpecifique} onChange={e => updateRow(setTab2, row.id, "objectifSpecifique", e.target.value)} /></div>
                <div className="space-y-2"><Label>Résultats attendus</Label><Textarea value={row.resultatsAttendus} onChange={e => updateRow(setTab2, row.id, "resultatsAttendus", e.target.value)} rows={2} /></div>
                <div className="space-y-2"><Label>Activités</Label><Textarea value={row.activites} onChange={e => updateRow(setTab2, row.id, "activites", e.target.value)} rows={2} /></div>
                <div className="space-y-2"><Label>Livrables</Label><Textarea value={row.livrables} onChange={e => updateRow(setTab2, row.id, "livrables", e.target.value)} rows={2} /></div>
              </div>
            ))}
            <Button variant="outline" onClick={() => addRow(setTab2, { id: "", objectifSpecifique: "", resultatsAttendus: "", activites: "", livrables: "" })} className="gap-2"><Plus className="w-4 h-4" /> Ajouter une ligne</Button>
          </div>
        );
      case 2:
        return (
          <div className="space-y-4 animate-fade-in">
            {tab3.map(row => (
              <div key={row.id} className="border rounded-lg p-4 space-y-3 relative group">
                <Button variant="ghost" size="sm" className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity text-destructive" onClick={() => removeRow(setTab3, row.id)}><Trash2 className="w-4 h-4" /></Button>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="space-y-2"><Label>Objectif Spécifique (OS)</Label><Input value={row.objectifSpecifique} onChange={e => updateRow(setTab3, row.id, "objectifSpecifique", e.target.value)} /></div>
                  <div className="space-y-2">
                    <Label>État de l'activité</Label>
                    <Select value={row.etat} onValueChange={v => updateRow(setTab3, row.id, "etat", v)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="En cours de préparation">En cours de préparation</SelectItem>
                        <SelectItem value="En cours de mise en œuvre">En cours de mise en œuvre</SelectItem>
                        <SelectItem value="Clôturée">Clôturée</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2"><Label>Activité prévue sur la période</Label><Textarea value={row.activitePrevue} onChange={e => updateRow(setTab3, row.id, "activitePrevue", e.target.value)} rows={2} /></div>
                <div className="space-y-2"><Label>Tâches réalisées</Label><Textarea value={row.tachesRealisees} onChange={e => updateRow(setTab3, row.id, "tachesRealisees", e.target.value)} rows={2} /></div>
                <div className="space-y-2">
                  <Label>Niveau d'avancement: {row.avancement}%</Label>
                  <Slider value={[row.avancement]} onValueChange={([v]) => updateRow(setTab3, row.id, "avancement", v)} max={100} step={5} className="py-2" />
                </div>
              </div>
            ))}
            <Button variant="outline" onClick={() => addRow(setTab3, { id: "", objectifSpecifique: "", activitePrevue: "", tachesRealisees: "", etat: "En cours de préparation" as const, avancement: 0 })} className="gap-2"><Plus className="w-4 h-4" /> Ajouter une ligne</Button>
          </div>
        );
      case 3:
        return (
          <div className="space-y-4 animate-fade-in">
            {tab4.map(row => (
              <div key={row.id} className="border rounded-lg p-4 space-y-3 relative group">
                <Button variant="ghost" size="sm" className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity text-destructive" onClick={() => removeRow(setTab4, row.id)}><Trash2 className="w-4 h-4" /></Button>
                <div className="space-y-2"><Label>Livrable/résultat prévu</Label><Input value={row.livrable} onChange={e => updateRow(setTab4, row.id, "livrable", e.target.value)} /></div>
                <div className="space-y-2"><Label>Description du contenu</Label><Textarea value={row.description} onChange={e => updateRow(setTab4, row.id, "description", e.target.value)} rows={2} /></div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="space-y-2">
                    <Label>Type</Label>
                    <Select value={row.type} onValueChange={v => updateRow(setTab4, row.id, "type", v)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {["Publications scientifiques","Prototypes / démonstrateurs","Brevets","Logiciels ou bases de données","Innovations développées","Études","Documents techniques","Autres"].map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Statut</Label>
                    <Select value={row.statut} onValueChange={v => updateRow(setTab4, row.id, "statut", v as any)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Terminé">Terminé</SelectItem>
                        <SelectItem value="En cours">En cours</SelectItem>
                        <SelectItem value="En retard">En retard</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Dissémination</Label>
                    <Select value={row.dissemination} onValueChange={v => updateRow(setTab4, row.id, "dissemination", v as any)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Public">Public</SelectItem>
                        <SelectItem value="Accès limité">Accès limité</SelectItem>
                        <SelectItem value="Consortium du projet">Consortium du projet</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            ))}
            <Button variant="outline" onClick={() => addRow(setTab4, { id: "", livrable: "", description: "", type: "Publications scientifiques", statut: "En cours" as const, dissemination: "Public" as const })} className="gap-2"><Plus className="w-4 h-4" /> Ajouter une ligne</Button>
          </div>
        );
      case 4:
        return (
          <div className="space-y-4 animate-fade-in">
            {tab5.map(row => (
              <div key={row.id} className="border rounded-lg p-4 space-y-3 relative group">
                <Button variant="ghost" size="sm" className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity text-destructive" onClick={() => removeRow(setTab5, row.id)}><Trash2 className="w-4 h-4" /></Button>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="space-y-2"><Label>Intitulé de l'événement</Label><Input value={row.intitule} onChange={e => updateRow(setTab5, row.id, "intitule", e.target.value)} /></div>
                  <div className="space-y-2"><Label>Activité cadre</Label><Input value={row.activiteCadre} onChange={e => updateRow(setTab5, row.id, "activiteCadre", e.target.value)} /></div>
                </div>
                <div className="space-y-2"><Label>Objectifs</Label><Textarea value={row.objectifs} onChange={e => updateRow(setTab5, row.id, "objectifs", e.target.value)} rows={2} /></div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="space-y-2"><Label>Date</Label><DatePickerField value={row.date} onChange={v => updateRow(setTab5, row.id, "date", v)} /></div>
                  <div className="space-y-2"><Label>Lieu</Label><Input value={row.lieu} onChange={e => updateRow(setTab5, row.id, "lieu", e.target.value)} /></div>
                  <div className="space-y-2"><Label>Nombre de participants</Label><Input type="number" min={0} value={row.nombreParticipants || ""} onChange={e => updateRow(setTab5, row.id, "nombreParticipants", Math.max(0, parseInt(e.target.value) || 0))} /></div>
                </div>
                <div className="space-y-2"><Label>Public cible</Label><Input value={row.publicCible} onChange={e => updateRow(setTab5, row.id, "publicCible", e.target.value)} /></div>
              </div>
            ))}
            <Button variant="outline" onClick={() => addRow(setTab5, { id: "", intitule: "", objectifs: "", activiteCadre: "", date: "", lieu: "", publicCible: "", nombreParticipants: 0 })} className="gap-2"><Plus className="w-4 h-4" /> Ajouter une ligne</Button>
          </div>
        );
      case 5:
        return (
          <div className="space-y-4 animate-fade-in">
            {tab6.map(row => (
              <div key={row.id} className="border rounded-lg p-4 space-y-3 relative group">
                <Button variant="ghost" size="sm" className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity text-destructive" onClick={() => removeRow(setTab6, row.id)}><Trash2 className="w-4 h-4" /></Button>
                <div className="space-y-2"><Label>Action de communication réalisée</Label><Textarea value={row.action} onChange={e => updateRow(setTab6, row.id, "action", e.target.value)} rows={2} /></div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="space-y-2"><Label>Activité concernée</Label><Input value={row.activiteConcernee} onChange={e => updateRow(setTab6, row.id, "activiteConcernee", e.target.value)} /></div>
                  <div className="space-y-2"><Label>Cible</Label><Input value={row.cible} onChange={e => updateRow(setTab6, row.id, "cible", e.target.value)} /></div>
                </div>
              </div>
            ))}
            <Button variant="outline" onClick={() => addRow(setTab6, { id: "", action: "", activiteConcernee: "", cible: "" })} className="gap-2"><Plus className="w-4 h-4" /> Ajouter une ligne</Button>
          </div>
        );
      case 6:
        return (
          <div className="space-y-4 animate-fade-in">
            {tab7.map(row => (
              <div key={row.id} className="border rounded-lg p-4 space-y-3 relative group">
                <Button variant="ghost" size="sm" className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity text-destructive" onClick={() => removeRow(setTab7, row.id)}><Trash2 className="w-4 h-4" /></Button>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="space-y-2"><Label>Date de la réunion</Label><DatePickerField value={row.date} onChange={v => updateRow(setTab7, row.id, "date", v)} /></div>
                  <div className="space-y-2"><Label>Lieu</Label><Input value={row.lieu} onChange={e => updateRow(setTab7, row.id, "lieu", e.target.value)} /></div>
                </div>
                <div className="space-y-2"><Label>Objet de la réunion</Label><Textarea value={row.objet} onChange={e => updateRow(setTab7, row.id, "objet", e.target.value)} rows={2} /></div>
                <div className="space-y-2"><Label>Partenaires participants</Label><Textarea value={row.partenaires} onChange={e => updateRow(setTab7, row.id, "partenaires", e.target.value)} rows={2} /></div>
              </div>
            ))}
            <Button variant="outline" onClick={() => addRow(setTab7, { id: "", date: "", lieu: "", objet: "", partenaires: "" })} className="gap-2"><Plus className="w-4 h-4" /> Ajouter une ligne</Button>
          </div>
        );
      case 7:
        return (
          <div className="space-y-4 animate-fade-in">
            {tab8.map(row => (
              <div key={row.id} className="border rounded-lg p-4 space-y-3 relative group">
                <Button variant="ghost" size="sm" className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity text-destructive" onClick={() => removeRow(setTab8, row.id)}><Trash2 className="w-4 h-4" /></Button>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="space-y-2"><Label>Nom & prénom</Label><Input value={row.nomPrenom} onChange={e => updateRow(setTab8, row.id, "nomPrenom", e.target.value)} /></div>
                  <div className="space-y-2">
                    <Label>Genre</Label>
                    <Select value={row.genre} onValueChange={v => updateRow(setTab8, row.id, "genre", v)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Homme">Homme</SelectItem>
                        <SelectItem value="Femme">Femme</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Type de personnel</Label>
                    <Select value={row.typePersonnel} onValueChange={v => updateRow(setTab8, row.id, "typePersonnel", v)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Docteur">Docteur</SelectItem>
                        <SelectItem value="Doctorant">Doctorant</SelectItem>
                        <SelectItem value="Étudiant en master">Étudiant en master</SelectItem>
                        <SelectItem value="Personnel d'appui">Personnel d'appui</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2"><Label>Partenaire</Label><Input value={row.partenaire} onChange={e => updateRow(setTab8, row.id, "partenaire", e.target.value)} /></div>
                </div>
              </div>
            ))}
            <Button variant="outline" onClick={() => addRow(setTab8, { id: "", nomPrenom: "", genre: "Homme" as const, typePersonnel: "Doctorant" as const, partenaire: "" })} className="gap-2"><Plus className="w-4 h-4" /> Ajouter une ligne</Button>
          </div>
        );
      case 8:
        return (
          <div className="space-y-4 animate-fade-in">
            {tab9.map(row => (
              <div key={row.id} className="border rounded-lg p-4 space-y-3 relative group">
                <Button variant="ghost" size="sm" className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity text-destructive" onClick={() => removeRow(setTab9, row.id)}><Trash2 className="w-4 h-4" /></Button>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="space-y-2"><Label>Équipement acquis</Label><Input value={row.equipement} onChange={e => updateRow(setTab9, row.id, "equipement", e.target.value)} /></div>
                  <div className="space-y-2">
                    <Label>Type d'équipement</Label>
                    <Select value={row.type} onValueChange={v => updateRow(setTab9, row.id, "type", v)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Équipement informatique">Équipement informatique</SelectItem>
                        <SelectItem value="Équipement scientifique">Équipement scientifique</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2"><Label>Laboratoire bénéficiaire</Label><Input value={row.laboratoire} onChange={e => updateRow(setTab9, row.id, "laboratoire", e.target.value)} /></div>
                </div>
              </div>
            ))}
            <Button variant="outline" onClick={() => addRow(setTab9, { id: "", equipement: "", type: "Équipement informatique" as const, laboratoire: "" })} className="gap-2"><Plus className="w-4 h-4" /> Ajouter une ligne</Button>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="bg-card rounded-lg shadow-sm border animate-fade-in-up">
      {/* Tab nav */}
      <div className="border-b overflow-x-auto">
        <div className="flex min-w-max">
          {TAB_NAMES.map((name, i) => (
            <button
              key={i}
              onClick={() => setCurrentTab(i)}
              className={cn(
                "px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors",
                currentTab === i
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground hover:border-border"
              )}
            >
              {i + 1}. {name}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        <h3 className="text-lg font-semibold mb-4 text-foreground not-italic" style={{ fontFamily: "var(--font-body)" }}>
          {TAB_NAMES[currentTab]}
        </h3>
        {renderTab()}
      </div>

      {/* Footer */}
      <div className="border-t p-4 space-y-3">
        <div className="flex items-center gap-3">
          <span className="text-sm text-muted-foreground font-medium">Étape {currentTab + 1} / 9</span>
          <Progress value={((currentTab + 1) / 9) * 100} className="flex-1 h-2" />
        </div>
        <div className="flex flex-wrap gap-2 justify-between">
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose}>Fermer</Button>
            <Button variant="ghost" onClick={onSaveDraft} className="gap-2"><Save className="w-4 h-4" /> Enregistrer brouillon</Button>
          </div>
          <div className="flex gap-2">
            {currentTab > 0 && (
              <Button variant="outline" onClick={() => setCurrentTab(currentTab - 1)} className="gap-2">
                <ChevronLeft className="w-4 h-4" /> Précédent
              </Button>
            )}
            {currentTab < 8 ? (
              <Button onClick={() => setCurrentTab(currentTab + 1)} className="gap-2">
                Suivant <ChevronRight className="w-4 h-4" />
              </Button>
            ) : (
              <Button onClick={handleSubmit} className="gap-2 bg-warning text-warning-foreground hover:bg-warning/90">
                <Send className="w-4 h-4" /> Soumettre pour validation
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReportForm;
