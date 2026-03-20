import * as React from 'react';
import { sp } from '../../AccesDemandeWebPart';
import {
  Stack,
  Dropdown,
  IDropdownOption,
  TextField,
  PrimaryButton,
  DefaultButton,
  MessageBar,
  MessageBarType,
  IPersonaProps,
  FontIcon,
  Text,
  mergeStyles,
  useTheme
} from '@fluentui/react';

// PeoplePicker (PnP React Controls)
import {
  PeoplePicker,
  IPeoplePickerContext,
  PrincipalType
} from '@pnp/spfx-controls-react/lib/PeoplePicker';

import Header from './Header';

/* ===============================
   TYPES & INTERFACES
================================ */
interface IFormDemandeProps {
  onCancel: () => void;                 // Retour à l'accueil
  onCreated: () => void;                 // Callback après création
  peoplePickerContext: IPeoplePickerContext;
  onGoAdmin?: () => void;                 // Accès à l'admin (optionnel)
}

interface IChoicesMap {
  Civilite: string[];
  PosteOccupe: string[];
  ServicesDepartements: string[];
  ObjetDemande: string[];
  SystemeDemande: string[];
}

interface IFieldInfoMinimal { Choices?: string[]; }

type IPersonaEx = IPersonaProps & { loginName?: string; id?: string };

// === PARAMÈTRES MÉTIER ===
const LIST_TITLE = 'AccesDemande';
const SENSITIVE_SYSTEMS = new Set<string>(['SAGE', 'PEGASE', 'ICAR']);

const PERIODICITE_OPTIONS: IDropdownOption[] = [
  { key: 'Aucune', text: 'Aucune' },
  { key: '3 mois', text: '3 mois' },
  { key: '6 mois', text: '6 mois' },
  { key: '12 mois', text: '12 mois' }
];

/* ===============================
   COMPOSANT PRINCIPAL
================================ */
const FormDemande: React.FC<IFormDemandeProps> = ({
  onCancel,
  onCreated,
  peoplePickerContext,
  onGoAdmin
}): JSX.Element => {
  const theme = useTheme();

  // Styles dynamiques avec le thème
  const pageContainer = React.useMemo(() => mergeStyles({
    background: '#f3f5f9',
    minHeight: '100vh',
    padding: '32px 24px'
  }), []);

  const formCard = React.useMemo(() => mergeStyles({
    maxWidth: '1000px',
    margin: '0 auto',
    background: '#ffffff',
    borderRadius: '20px',
    boxShadow: '0 6px 16px rgba(0,0,0,0.08)',
    padding: '32px'
  }), []);

  const sectionCard = React.useMemo(() => mergeStyles({
    background: '#faf9f8',
    borderRadius: '16px',
    padding: '20px',
    marginBottom: '24px',
    border: '1px solid #edebe9'
  }), []);

  const sectionHeader = React.useMemo(() => mergeStyles({
    display: 'flex',
    alignItems: 'center',
    marginBottom: '20px',
    borderBottom: `2px solid ${theme.palette.themePrimary}`,
    paddingBottom: '8px'
  }), [theme]);

  const iconClass = React.useMemo(() => mergeStyles({
    fontSize: '24px',
    marginRight: '12px',
    color: theme.palette.themePrimary
  }), [theme]);

  const titleClass = React.useMemo(() => mergeStyles({
    fontWeight: 600,
    fontSize: '20px',
    color: '#323130'
  }), []);

  const fieldGroup = React.useMemo(() => mergeStyles({
    display: 'flex',
    flexWrap: 'wrap',
    gap: '20px'
  }), []);

  const fieldItem = React.useMemo(() => mergeStyles({
    flex: '1 1 250px',
    minWidth: '250px'
  }), []);

  // États du formulaire
  const [loading, setLoading] = React.useState<boolean>(true);
  const [saving, setSaving] = React.useState<boolean>(false);
  const [error, setError] = React.useState<string | null>(null);

  const [choices, setChoices] = React.useState<IChoicesMap>({
    Civilite: [],
    PosteOccupe: [],
    ServicesDepartements: [],
    ObjetDemande: [],
    SystemeDemande: [],
  });

  const [civilite, setCivilite] = React.useState<string | undefined>();
  const [poste, setPoste] = React.useState<string | undefined>();
  const [service, setService] = React.useState<string | undefined>();
  const [objet, setObjet] = React.useState<string | undefined>();
  const [systeme, setSysteme] = React.useState<string | undefined>();
  const [dateDemande, setDateDemande] = React.useState<string>('');
  const [commentaire, setCommentaire] = React.useState<string>('');
  const [demandeurLogin, setDemandeurLogin] = React.useState<string | null>(null);
  const [dateDebutAcces, setDateDebutAcces] = React.useState<string>('');
  const [dateFinAcces, setDateFinAcces] = React.useState<string>('');
  const [periodiciteRevue, setPeriodiciteRevue] = React.useState<string>('Aucune');

  const isSensitive = React.useMemo(() => !!systeme && SENSITIVE_SYSTEMS.has(systeme), [systeme]);

  React.useEffect(() => {
    const todayISO = new Date().toISOString().slice(0, 10);
    setDateDemande(todayISO);
  }, []);

  React.useEffect((): void => {
    const load = async (): Promise<void> => {
      try {
        setError(null);
        setLoading(true);

        const list = sp.web.lists.getByTitle(LIST_TITLE);

        const civ = await list.fields.getByInternalNameOrTitle('Civilite')() as IFieldInfoMinimal;
        const pos = await list.fields.getByInternalNameOrTitle('PosteOccupe')() as IFieldInfoMinimal;
        const srv = await list.fields.getByInternalNameOrTitle('ServicesDepartements')() as IFieldInfoMinimal;
        const obj = await list.fields.getByInternalNameOrTitle('ObjetDemande')() as IFieldInfoMinimal;
        const sys = await list.fields.getByInternalNameOrTitle('SystemeDemande')() as IFieldInfoMinimal;

        setChoices({
          Civilite: civ.Choices ?? [],
          PosteOccupe: pos.Choices ?? [],
          ServicesDepartements: srv.Choices ?? [],
          ObjetDemande: obj.Choices ?? [],
          SystemeDemande: sys.Choices ?? [],
        });

        setLoading(false);
      } catch (e: unknown) {
        const message = (e && typeof e === 'object' && 'message' in e)
          ? String((e as { message: unknown }).message)
          : 'Erreur inconnue';
        setError(`Erreur lors du chargement des options. ${message}`);
        setLoading(false);
      }
    };

    load().catch((err) => console.error(err));
  }, []);

  const optionsFrom = (arr: string[]): IDropdownOption[] =>
    arr.map((v) => ({ key: v, text: v }));

  const onPeopleChange = (items: IPersonaProps[]): void => {
    if (items && items.length > 0) {
      const sel = items[0] as IPersonaEx;
      setDemandeurLogin(sel.loginName ?? (sel.id as string) ?? null);
    } else {
      setDemandeurLogin(null);
    }
  };

  const isDatesValid = React.useMemo(() => {
    if (!isSensitive) return true;
    if (!dateDebutAcces || !dateFinAcces) return false;
    const d1 = new Date(dateDebutAcces);
    const d2 = new Date(dateFinAcces);
    return d2.getTime() > d1.getTime();
  }, [isSensitive, dateDebutAcces, dateFinAcces]);

  const isFormValid =
    !!civilite &&
    !!demandeurLogin &&
    !!poste &&
    !!service &&
    !!objet &&
    !!systeme &&
    !!dateDemande &&
    commentaire.trim().length > 0 &&
    isDatesValid &&
    (!isSensitive || (dateDebutAcces !== '' && dateFinAcces !== ''));

  const onSubmit = async (ev: React.FormEvent<HTMLFormElement>): Promise<void> => {
    ev.preventDefault();

    if (!isFormValid) {
      setError("Veuillez remplir tous les champs obligatoires et vérifier la cohérence des dates.");
      return;
    }

    try {
      setSaving(true);
      setError(null);

      let demandeurId: number;
      if (demandeurLogin) {
        const user = await sp.web.siteUsers.getByLoginName(demandeurLogin)();
        demandeurId = user.Id;
      } else {
        const me = await sp.web.currentUser();
        demandeurId = me.Id;
      }

      const payload: Record<string, unknown> = {
        Civilite: civilite ?? '',
        DemandeurId: demandeurId,
        PosteOccupe: poste ?? '',
        ServicesDepartements: service ?? '',
        ObjetDemande: objet ?? '',
        SystemeDemande: systeme ?? '',
        DateDemande: dateDemande ? new Date(dateDemande).toISOString() : new Date().toISOString(),
        Statut: 'En Attente',
        CommentaireDemandeur: commentaire || '',
        DateDebutAcces: dateDebutAcces ? new Date(dateDebutAcces).toISOString() : null,
        DateFinAcces: dateFinAcces ? new Date(dateFinAcces).toISOString() : null,
        PeriodiciteRevue: periodiciteRevue
      };

      await sp.web.lists.getByTitle(LIST_TITLE).items.add(payload);

      setSaving(false);
      onCreated();
    } catch (e: unknown) {
      const message = (e && typeof e === 'object' && 'message' in e)
        ? String((e as { message: unknown }).message)
        : 'Erreur inconnue';
      setError(`Erreur lors de l'enregistrement de la demande. ${message}`);
      setSaving(false);
    }
  };

  return (
    <div className={pageContainer}>
      <Header
        onGoHome={onCancel}          // Retour à l'accueil
        onGoAdmin={onGoAdmin}        // Lien admin actif si disponible
        // onCreateRequest non fourni → lien Nouvelle demande grisé
      />

      <div className={formCard}>
        <Stack horizontal verticalAlign="center" tokens={{ childrenGap: 12 }} styles={{ root: { marginBottom: 24 } }}>
          <FontIcon iconName="FormLibrary" className={iconClass} style={{ fontSize: 32 }} />
          <h1 className={titleClass}>Nouvelle demande d&apos;accès</h1>
        </Stack>

        <form onSubmit={onSubmit}>
          {error && (
            <MessageBar messageBarType={MessageBarType.error} onDismiss={() => setError(null)}>
              {error}
            </MessageBar>
          )}

          {/* SECTION 1 : INFORMATIONS GÉNÉRALES */}
          <div className={sectionCard}>
            <div className={sectionHeader}>
              <FontIcon iconName="Contact" className={iconClass} />
              <Text variant="large" styles={{ root: { fontWeight: 600 } }}>Informations générales</Text>
            </div>
            <div className={fieldGroup}>
              <div className={fieldItem}>
                <Dropdown
                  label="Civilité"
                  placeholder="Sélectionner"
                  options={optionsFrom(choices.Civilite)}
                  selectedKey={civilite}
                  onChange={(_, opt) => setCivilite(opt?.key as string)}
                  required
                  disabled={loading}
                />
              </div>
              <div className={fieldItem}>
                <PeoplePicker
                  context={peoplePickerContext}
                  titleText="Demandeur"
                  personSelectionLimit={1}
                  showtooltip={true}
                  required={true}
                  principalTypes={[PrincipalType.User]}
                  resolveDelay={500}
                  useSubstrateSearch={true}
                  onChange={onPeopleChange}
                />
              </div>
              <div className={fieldItem}>
                <Dropdown
                  label="Poste occupé"
                  placeholder="Sélectionner"
                  options={optionsFrom(choices.PosteOccupe)}
                  selectedKey={poste}
                  onChange={(_, opt) => setPoste(opt?.key as string)}
                  required
                  disabled={loading}
                />
              </div>
              <div className={fieldItem}>
                <Dropdown
                  label="Services / Départements"
                  placeholder="Sélectionner"
                  options={optionsFrom(choices.ServicesDepartements)}
                  selectedKey={service}
                  onChange={(_, opt) => setService(opt?.key as string)}
                  required
                  disabled={loading}
                />
              </div>
            </div>
          </div>

          {/* SECTION 2 : DÉTAILS DE LA DEMANDE */}
          <div className={sectionCard}>
            <div className={sectionHeader}>
              <FontIcon iconName="FileRequest" className={iconClass} />
              <Text variant="large" styles={{ root: { fontWeight: 600 } }}>Détails de la demande</Text>
            </div>
            <div className={fieldGroup}>
              <div className={fieldItem}>
                <Dropdown
                  label="Objet de la demande"
                  placeholder="Sélectionner"
                  options={optionsFrom(choices.ObjetDemande)}
                  selectedKey={objet}
                  onChange={(_, opt) => setObjet(opt?.key as string)}
                  required
                  disabled={loading}
                />
              </div>
              <div className={fieldItem}>
                <Dropdown
                  label="Système demandé"
                  placeholder="Sélectionner"
                  options={optionsFrom(choices.SystemeDemande)}
                  selectedKey={systeme}
                  onChange={(_, opt) => setSysteme(opt?.key as string)}
                  required
                  disabled={loading}
                />
              </div>
              <div className={fieldItem}>
                <TextField
                  label="Date de la demande"
                  type="date"
                  value={dateDemande}
                  onChange={(_, v) => setDateDemande(v || '')}
                  required
                />
              </div>
            </div>
          </div>

          {/* SECTION 3 : PÉRIODE D'ACCÈS ET REVUE */}
          <div className={sectionCard}>
            <div className={sectionHeader}>
              <FontIcon iconName="Calendar" className={iconClass} />
              <Text variant="large" styles={{ root: { fontWeight: 600 } }}>Période d&apos;accès et revue</Text>
            </div>
            <div className={fieldGroup}>
              <div className={fieldItem}>
                <TextField
                  label="Date début d'accès"
                  type="date"
                  value={dateDebutAcces}
                  onChange={(_, v) => setDateDebutAcces(v || '')}
                  required={isSensitive}
                  description={isSensitive ? 'Obligatoire pour les systèmes sensibles' : 'Optionnel'}
                />
              </div>
              <div className={fieldItem}>
                <TextField
                  label="Date fin d'accès"
                  type="date"
                  value={dateFinAcces}
                  onChange={(_, v) => setDateFinAcces(v || '')}
                  required={isSensitive}
                  errorMessage={
                    isSensitive && dateDebutAcces && dateFinAcces &&
                    new Date(dateFinAcces).getTime() <= new Date(dateDebutAcces).getTime()
                      ? 'La date de fin doit être postérieure à la date de début.'
                      : undefined
                  }
                  description={isSensitive ? 'Obligatoire pour les systèmes sensibles' : 'Optionnel'}
                />
              </div>
              <div className={fieldItem}>
                <Dropdown
                  label="Périodicité de revue"
                  options={PERIODICITE_OPTIONS}
                  selectedKey={periodiciteRevue}
                  onChange={(_, opt) => setPeriodiciteRevue(String(opt?.key ?? 'Aucune'))}
                />
              </div>
            </div>
          </div>

          {/* SECTION 4 : COMMENTAIRE */}
          <div className={sectionCard}>
            <div className={sectionHeader}>
              <FontIcon iconName="Comment" className={iconClass} />
              <Text variant="large" styles={{ root: { fontWeight: 600 } }}>Commentaire</Text>
            </div>
            <TextField
              label="Commentaire"
              multiline
              rows={4}
              value={commentaire}
              onChange={(_, v) => setCommentaire(v || '')}
              required
              placeholder="Ajoutez un commentaire (obligatoire)"
            />
          </div>

          {/* BOUTONS D'ACTION */}
          <Stack horizontal horizontalAlign="end" tokens={{ childrenGap: 12 }} styles={{ root: { marginTop: 24 } }}>
            <DefaultButton text="Annuler" onClick={onCancel} disabled={saving} />
            <PrimaryButton
              type="submit"
              text={saving ? 'Création en cours...' : 'Créer la demande'}
              disabled={saving || loading || !isFormValid}
              styles={{ root: { minWidth: 200 } }}
            />
          </Stack>
          {saving && <MessageBar messageBarType={MessageBarType.info}>Enregistrement en cours...</MessageBar>}
        </form>
      </div>
    </div>
  );
};

export default FormDemande;