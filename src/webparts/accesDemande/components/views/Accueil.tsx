import * as React from 'react';
import {
  Stack,
  PrimaryButton,
  Icon,
  MessageBar,
  MessageBarType,
  Spinner,
  SpinnerSize,
  useTheme,
  FontIcon,
  mergeStyleSets
} from '@fluentui/react';
import { sp } from '../../AccesDemandeWebPart';
import Header from './Header';

interface IAccueilProps {
  onCreateRequest: () => void;
  onGoAdmin?: () => void;
  showAdmin?: boolean;
}

interface IStats {
  enAttente: number;
  approuvees: number;
  rejetees: number;
  revoquees: number;
  total: number;
}

// Type local pour les éléments de liste
interface IListItem {
  Statut: string;
}

const Accueil: React.FC<IAccueilProps> = (props): JSX.Element => {
  const theme = useTheme();
  const [stats, setStats] = React.useState<IStats>({
    enAttente: 0,
    approuvees: 0,
    rejetees: 0,
    revoquees: 0,
    total: 0
  });
  const [loading, setLoading] = React.useState<boolean>(true);
  const [error, setError] = React.useState<string | null>(null);

  // Chargement des statistiques depuis SharePoint
  React.useEffect(() => {
    const loadStats = async (): Promise<void> => {
      try {
        setLoading(true);
        const items = await sp.web.lists
          .getByTitle('AccesDemande')
          .items.select('Statut')
          .top(5000)() as IListItem[];
        const enAttente = items.filter((i) => i.Statut === 'En Attente').length;
        const approuvees = items.filter((i) => i.Statut === 'Approuvée').length;
        const rejetees = items.filter((i) => i.Statut === 'Rejetée').length;
        const revoquees = items.filter((i) => i.Statut === 'Révoquée').length;
        setStats({
          enAttente,
          approuvees,
          rejetees,
          revoquees,
          total: items.length
        });
      } catch (err) {
        console.error(err);
        setError('Impossible de charger les statistiques.');
      } finally {
        setLoading(false);
      }
    };
    loadStats().catch(console.error);
  }, []);

  const classes = mergeStyleSets({
    page: {
      minHeight: '100vh',
      background: '#fafafa'
    },
    contentWrap: {
      maxWidth: 1200,
      margin: '0 auto',
      padding: '0 24px'
    },
    hero: {
      marginTop: 50,
      textAlign: 'center',
      background: 'linear-gradient(135deg, #ffffff 0%, #f9f9f9 100%)',
      borderRadius: 32,
      padding: '60px 50px',
      boxShadow: '0 15px 30px rgba(0,0,0,0.05)',
      border: '1px solid #f0f0f0'
    },
    heroContent: {
      maxWidth: 800,
      margin: '0 auto'
    },
    title: {
      fontSize: 48,
      fontWeight: 800,
      color: '#111',
      lineHeight: '64px',
      marginBottom: 20
    },
    subtitle: {
      fontSize: 18,
      color: '#555',
      maxWidth: 700,
      lineHeight: '30px',
      margin: '0 auto 30px auto'
    },
    ctaButton: {
      background: theme.palette.themePrimary,
      border: 'none',
      padding: '16px 32px',
      borderRadius: 40,
      fontWeight: 600,
      fontSize: 16,
      selectors: {
        ':hover': {
          background: theme.palette.themeDark
        }
      }
    },
    statsSection: {
      marginTop: 50,
      display: 'flex',
      gap: 24,
      justifyContent: 'center',
      flexWrap: 'wrap'
    },
    statCard: {
      background: '#ffffff',
      padding: '24px 32px',
      borderRadius: 24,
      boxShadow: '0 6px 16px rgba(0,0,0,0.03)',
      border: '1px solid #f0f0f0',
      minWidth: 150,
      textAlign: 'center',
      transition: 'transform 0.2s, box-shadow 0.2s',
      selectors: {
        ':hover': {
          transform: 'translateY(-4px)',
          boxShadow: '0 12px 24px rgba(0,0,0,0.08)'
        }
      }
    },
    statNumber: {
      fontSize: 42,
      fontWeight: 700,
      color: theme.palette.themePrimary,
      lineHeight: 1.2,
      marginBottom: 16
    },
    statLabel: {
      fontSize: 16,
      color: '#777',
      marginTop: 4
    },
    featuresSection: {
      marginTop: 80,
      marginBottom: 60
    },
    sectionSubtitle: {
      fontSize: 18,
      textAlign: 'center',
      color: '#777',
      maxWidth: 700,
      margin: '0 auto 50px auto'
    },
    cardsGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
      gap: 30
    },
    card: {
      background: '#ffffff',
      padding: 36,
      borderRadius: 28,
      border: '1px solid #f1f1f1',
      boxShadow: '0 10px 20px rgba(0,0,0,0.02)',
      transition: 'all 0.2s',
      selectors: {
        ':hover': {
          boxShadow: '0 20px 30px rgba(0,0,0,0.05)',
          borderColor: theme.palette.themeLighter
        }
      }
    },
    cardIcon: {
      fontSize: 40,
      color: theme.palette.themePrimary,
      marginBottom: 20,
      display: 'inline-block',
      background: theme.palette.themeLighter,
      padding: 16,
      borderRadius: 20
    },
    cardTitle: {
      fontSize: 22,
      fontWeight: 700,
      marginBottom: 12,
      color: '#222'
    },
    cardText: {
      fontSize: 15,
      color: '#666',
      lineHeight: '26px'
    }
  });

  return (
    <Stack className={classes.page}>
      <Header
  onCreateRequest={props.onCreateRequest}
  onGoAdmin={props.onGoAdmin}
  // onGoHome non fourni → lien Accueil grisé
/>

      <div className={classes.contentWrap}>
        {/* Hero section centrée sans image */}
        <div className={classes.hero}>
          <div className={classes.heroContent}>
            <h1 className={classes.title}>
              Gérez vos accès<br />en toute simplicité
            </h1>
            <p className={classes.subtitle}>
              Plateforme centralisée pour les demandes d&apos;accès aux systèmes sensibles. 
              Automatisation, traçabilité et conformité.
            </p>
            <PrimaryButton
              className={classes.ctaButton}
              onClick={props.onCreateRequest}
            >
              <Icon iconName="Add" style={{ marginRight: 10 }} />
              Créer une demande
            </PrimaryButton>
          </div>
        </div>

        {/* Statistiques clés */}
        {loading ? (
          <Spinner size={SpinnerSize.large} label="Chargement des statistiques..." styles={{ root: { marginTop: 40 } }} />
        ) : error ? (
          <MessageBar messageBarType={MessageBarType.error}>{error}</MessageBar>
        ) : (
          <div className={classes.statsSection}>
            <div className={classes.statCard}>
              <div className={classes.statNumber}>{stats.total}</div>
              <div className={classes.statLabel}>Demandes totales</div>
            </div>
            <div className={classes.statCard}>
              <div className={classes.statNumber}>{stats.enAttente}</div>
              <div className={classes.statLabel}>En attente</div>
            </div>
            <div className={classes.statCard}>
              <div className={classes.statNumber}>{stats.approuvees}</div>
              <div className={classes.statLabel}>Approuvées</div>
            </div>
            <div className={classes.statCard}>
              <div className={classes.statNumber}>{stats.rejetees}</div>
              <div className={classes.statLabel}>Rejetées</div>
            </div>
            <div className={classes.statCard}>
              <div className={classes.statNumber}>{stats.revoquees}</div>
              <div className={classes.statLabel}>Révoquées</div>
            </div>
          </div>
        )}

        {/* Section fonctionnalités */}
        <div className={classes.featuresSection}>
          <p className={classes.sectionSubtitle}>
            Une solution complète intégrée à votre environnement Microsoft 365
          </p>
          <div className={classes.cardsGrid}>
            <div className={classes.card}>
              <FontIcon iconName="Flow" className={classes.cardIcon} />
              <div className={classes.cardTitle}>Workflow automatisé</div>
              <div className={classes.cardText}>
                Validation hiérarchique et technique intégrée, notifications en temps réel.
              </div>
            </div>
            <div className={classes.card}>
              <FontIcon iconName="Shield" className={classes.cardIcon} />
              <div className={classes.cardTitle}>Sécurité renforcée</div>
              <div className={classes.cardText}>
                Conformité RGPD, gestion des habilitations et audit complet.
              </div>
            </div>
            <div className={classes.card}>
              <FontIcon iconName="AnalyticsView" className={classes.cardIcon} />
              <div className={classes.cardTitle}>Tableau de bord</div>
              <div className={classes.cardText}>
                Suivi en temps réel de l&apos;avancement des demandes et indicateurs.
              </div>
            </div>
            <div className={classes.card}>
              <FontIcon iconName="SharePointLogo" className={classes.cardIcon} />
              <div className={classes.cardTitle}>Intégration SharePoint</div>
              <div className={classes.cardText}>
                Données stockées et sécurisées dans votre environnement Microsoft.
              </div>
            </div>
            <div className={classes.card}>
              <FontIcon iconName="Mail" className={classes.cardIcon} />
              <div className={classes.cardTitle}>Notifications email</div>
              <div className={classes.cardText}>
                Alertes automatiques aux validateurs et aux demandeurs.
              </div>
            </div>
            <div className={classes.card}>
              <FontIcon iconName="History" className={classes.cardIcon} />
              <div className={classes.cardTitle}>Historique complet</div>
              <div className={classes.cardText}>
                Traçabilité de toutes les actions sur les demandes.
              </div>
            </div>
          </div>
        </div>
      </div>
    </Stack>
  );
};

export default Accueil;