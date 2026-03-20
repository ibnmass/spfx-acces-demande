import * as React from 'react';
import { ThemeProvider, createTheme, ITheme, PrimaryButton, Stack, MessageBar, MessageBarType, DefaultButton } from '@fluentui/react';
import { IAccesDemandeProps } from './IAccesDemandeProps';
import Accueil from './views/Accueil';
import FormDemande from './views/FormDemande';
import Admin from './views/Admin';
import { IPeoplePickerContext } from '@pnp/spfx-controls-react/lib/PeoplePicker';
import { sp } from '../AccesDemandeWebPart';

const redWhiteTheme: ITheme = createTheme({
  palette: {
    themePrimary: '#c50f1f',
    // ... thème inchangé
  }
});

interface IAdminItem {
  Users?: {  // Attention : "Users" avec U majuscule
    Id: number;
  };
}

const AccesDemande: React.FC<IAccesDemandeProps> = (props) => {
  const [view, setView] = React.useState<'home' | 'form' | 'done' | 'admin'>('home');
  const [adminIds, setAdminIds] = React.useState<Set<number>>(new Set());
  const [loadingAdmins, setLoadingAdmins] = React.useState<boolean>(true);
  const [currentUserId, setCurrentUserId] = React.useState<number | null>(null);

  // Charger l'ID de l'utilisateur courant
  React.useEffect(() => {
    const loadCurrentUser = async (): Promise<void> => {
      try {
        const user = await sp.web.currentUser();
        console.log('Utilisateur courant:', user);
        setCurrentUserId(user.Id);
      } catch (error) {
        console.error("Erreur lors du chargement de l'utilisateur courant", error);
      }
    };
    loadCurrentUser().catch(console.error);
  }, []);

  // Charger les IDs des administrateurs depuis la liste SharePoint
  React.useEffect(() => {
    const loadAdmins = async (): Promise<void> => {
      try {
        // On utilise le nom exact : "Users" avec U majuscule
        const items = await sp.web.lists.getByTitle("AdministrateursAcces").items
          .select("Users/Id")
          .expand("Users")() as IAdminItem[];
        console.log('Éléments récupérés de la liste admin:', items);

        const ids = items
          .map(item => item.Users?.Id)
          .filter((id): id is number => !!id);
        console.log('IDs administrateurs extraits:', ids);

        setAdminIds(new Set(ids));
      } catch (error) {
        console.error("Erreur lors du chargement des administrateurs", error);
      } finally {
        setLoadingAdmins(false);
      }
    };
    loadAdmins().catch(console.error);
  }, []);

  // Vérification
  const isAdminAllowed = currentUserId !== null && adminIds.has(currentUserId);
  console.log('currentUserId:', currentUserId, 'adminIds:', Array.from(adminIds), 'isAdminAllowed:', isAdminAllowed);

  // Contexte pour le PeoplePicker
  const peoplePickerContext = ({
    absoluteUrl: props.webAbsoluteUrl,
    msGraphClientFactory: props.msGraphClientFactory,
    spHttpClient: props.spHttpClient,
  } as unknown) as IPeoplePickerContext;

  // Rendu conditionnel pour l'admin
  const renderAdminOrDenied = (): JSX.Element => {
    if (loadingAdmins) {
      return (
        <Stack style={{ padding: 20 }}>
          <MessageBar messageBarType={MessageBarType.info}>
            Chargement des droits d&apos;accès...
          </MessageBar>
        </Stack>
      );
    }
    if (isAdminAllowed) {
      return <Admin onBack={() => setView('home')} />;
    }
    return (
      <Stack tokens={{ childrenGap: 12 }} style={{ padding: 20 }}>
        <MessageBar messageBarType={MessageBarType.blocked}>
          Accès refusé – vous n&apos;êtes pas autorisé à accéder à l&apos;espace administrateur.
        </MessageBar>
        <DefaultButton onClick={() => setView('home')}>Retour à l&apos;accueil</DefaultButton>
      </Stack>
    );
  };

  return (
    <ThemeProvider theme={redWhiteTheme}>
      <div style={{ background: '#fff' }}>
        {view === 'home' && (
          <Accueil
            onCreateRequest={() => setView('form')}
            onGoAdmin={isAdminAllowed ? () => setView('admin') : undefined}
            showAdmin={isAdminAllowed}
          />
        )}

        {view === 'form' && (
          <FormDemande
            onCancel={() => setView('home')}
            onCreated={() => setView('done')}
            peoplePickerContext={peoplePickerContext}
          />
        )}

        {view === 'admin' && renderAdminOrDenied()}

        {view === 'done' && (
          <Stack style={{ padding: 20 }} tokens={{ childrenGap: 12 }}>
            <h3>La demande a été enregistrée avec succès.</h3>
            <PrimaryButton onClick={() => setView('home')}>
              Retour à l&apos;accueil
            </PrimaryButton>
          </Stack>
        )}
      </div>
    </ThemeProvider>
  );
};

export default AccesDemande;