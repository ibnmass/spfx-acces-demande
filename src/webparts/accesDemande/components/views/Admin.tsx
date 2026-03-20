import * as React from 'react';
import {
  Stack,
  Text,
  MessageBar,
  MessageBarType,
  DetailsList,
  IColumn,
  SelectionMode,
  PrimaryButton,
  DefaultButton,
  SearchBox,
  IconButton
} from '@fluentui/react';

import { sp } from '../../AccesDemandeWebPart';
import Header from './Header';

// Imports pour Chart.js
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';
import { Bar } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

/* ===============================
 TYPES
================================ */

interface IAdminProps {
  onBack: () => void;               // Retour à l'accueil
  onCreateRequest?: () => void;      // Ouvrir le formulaire (optionnel)
}

interface IRawItem {
  Id: number;
  Demandeur?: { Title?: string };
  ServicesDepartements?: string;
  ObjetDemande?: string;
  SystemeDemande?: string;
  Statut?: string;
  DateFinAcces?: string;
  PeriodiciteRevue?: string;
}

interface IKpiCardProps {
  title: string;
  value: number;
  color: string;
}

/* ===============================
 KPI CARD
================================ */

const KpiCard: React.FC<IKpiCardProps> = ({
  title,
  value,
  color
}): JSX.Element => (
  <Stack styles={{
    root: {
      flex: 1,
      padding: 22,
      borderRadius: 20,
      background: '#fff',
      border: '1px solid #eee',
      transition: '0.3s'
    }
  }}>
    <Text styles={{ root: { color, fontWeight: 800 } }}>
      {title}
    </Text>

    <Text variant="xxLarge" styles={{ root: { fontWeight: 900 } }}>
      {value}
    </Text>
  </Stack>
);

/* =============================== */

const LIST_TITLE = 'AccesDemande';

const Admin: React.FC<IAdminProps> = ({ onBack, onCreateRequest }): JSX.Element => {

  const [rows, setRows] = React.useState<IRawItem[]>([]);
  const [filteredRows, setFilteredRows] = React.useState<IRawItem[]>([]);

  const [loading, setLoading] = React.useState<boolean>(false);
  const [error, setError] = React.useState<string | null>(null);

  const [searchText, setSearchText] = React.useState<string>('');

  const [counts, setCounts] = React.useState({
    enAttente: 0,
    approuvees: 0,
    rejetees: 0,
    expirees: 0
  });

/* ===============================
 DONNÉES POUR LE GRAPHIQUE
================================ */

  const chartData = {
    labels: ['En Attente', 'Approuvées', 'Rejetées', 'Expirées'],
    datasets: [
      {
        label: 'Nombre de demandes',
        data: [
          counts.enAttente,
          counts.approuvees,
          counts.rejetees,
          counts.expirees
        ],
        backgroundColor: [
          '#FFB900',
          '#107c10',
          '#c50f1f',
          '#742774'
        ],
        borderRadius: 8,
      }
    ]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'top' as const },
      title: { display: false },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: { stepSize: 1 }
      }
    }
  };

/* ===============================
 FONCTION DE MISE À JOUR DES EXPIRÉES
================================ */

  const updateExpiredStatus = async (items: IRawItem[]): Promise<void> => {
    const today = new Date().getTime();
    const expiredItems = items.filter(x =>
      x.Statut === 'Approuvée' &&
      x.DateFinAcces &&
      new Date(x.DateFinAcces).getTime() < today
    );

    for (const item of expiredItems) {
      try {
        await sp.web.lists.getByTitle(LIST_TITLE)
          .items.getById(item.Id)
          .update({ Statut: 'Expirée' });
        console.log(`Demande ${item.Id} marquée comme expirée`);
      } catch (err) {
        console.error(`Erreur mise à jour demande ${item.Id}`, err);
      }
    }
  };

/* ===============================
 LOAD DATA
================================ */

  const loadData = React.useCallback(async (): Promise<void> => {
    try {
      setLoading(true);

      const raw: IRawItem[] = await sp.web.lists
        .getByTitle(LIST_TITLE)
        .items
        .select(
          'Id',
          'Demandeur/Title',
          'ServicesDepartements',
          'ObjetDemande',
          'SystemeDemande',
          'Statut',
          'DateFinAcces',
          'PeriodiciteRevue'
        )
        .expand('Demandeur')
        .top(5000)();

      const mapped = raw.map(p => ({ ...p }));

      await updateExpiredStatus(mapped);

      const updatedRaw: IRawItem[] = await sp.web.lists
        .getByTitle(LIST_TITLE)
        .items
        .select(
          'Id',
          'Demandeur/Title',
          'ServicesDepartements',
          'ObjetDemande',
          'SystemeDemande',
          'Statut',
          'DateFinAcces',
          'PeriodiciteRevue'
        )
        .expand('Demandeur')
        .top(5000)();

      const updatedMapped = updatedRaw.map(p => ({ ...p }));

      setCounts({
        enAttente: updatedMapped.filter(x => x.Statut === 'En Attente').length,
        approuvees: updatedMapped.filter(x => x.Statut === 'Approuvée').length,
        rejetees: updatedMapped.filter(x => 
          x.Statut === 'Rejetée' || x.Statut === 'Révoquée'
        ).length,
        expirees: updatedMapped.filter(x => x.Statut === 'Expirée').length
      });

      setRows(updatedMapped);
      setFilteredRows(updatedMapped);
      setLoading(false);

    } catch (e) {
      console.error(e);
      setError("Erreur chargement données");
      setLoading(false);
    }
  }, []);

/* ===============================
 ACTIONS METIER
================================ */

  const approve = async (id: number): Promise<void> => {
    await sp.web.lists.getByTitle(LIST_TITLE)
      .items.getById(id)
      .update({ Statut: 'Approuvée' });
    await loadData();
  };

  const reject = async (id: number): Promise<void> => {
    await sp.web.lists.getByTitle(LIST_TITLE)
      .items.getById(id)
      .update({ Statut: 'Rejetée' });
    await loadData();
  };

  const revoke = async (id: number): Promise<void> => {
    await sp.web.lists.getByTitle(LIST_TITLE)
      .items.getById(id)
      .update({ Statut: 'Révoquée' });
    await loadData();
  };

/* ===============================
 FILTERING
================================ */

  React.useEffect(() => {
    let data = [...rows];
    if (searchText) {
      data = data.filter(d =>
        d.ObjetDemande?.toLowerCase().includes(searchText.toLowerCase()) ||
        d.Demandeur?.Title?.toLowerCase().includes(searchText.toLowerCase())
      );
    }
    setFilteredRows(data);
  }, [rows, searchText]);

/* ===============================
 STATUS BADGE
================================ */

  const statusBadge = (statut?: string): JSX.Element => {
    let bg = '#eee';
    let color = '#000';
    let label = statut;

    switch (statut) {
      case 'Approuvée':
        bg = '#DFF6DD';
        color = '#107C10';
        label = 'VALIDÉ';
        break;
      case 'En Attente':
        bg = '#FFF4CE';
        color = '#8A6D00';
        label = 'EN ATTENTE';
        break;
      case 'Rejetée':
        bg = '#FDE7E9';
        color = '#A4262C';
        label = 'REFUSÉ';
        break;
      case 'Expirée':
        bg = '#E5E5E5';
        color = '#666666';
        label = 'EXPIRÉ';
        break;
      case 'Révoquée':
        bg = '#FCE2F0';
        color = '#A8006C';
        label = 'RÉVOQUÉ';
        break;
    }

    return (
      <span style={{
        background: bg,
        color,
        padding: '6px 14px',
        borderRadius: 999,
        fontWeight: 800,
        fontSize: 11
      }}>
        {label}
      </span>
    );
  };

/* ===============================
 TABLE COLUMNS
================================ */

  const columns: IColumn[] = [
    {
      key: 'dem',
      name: 'Demandeur',
      minWidth: 150,
      onRender: (i: IRawItem) => i.Demandeur?.Title
    },
    {
      key: 'obj',
      name: 'Objet',
      fieldName: 'ObjetDemande',
      minWidth: 220
    },
    {
      key: 'stat',
      name: 'Statut',
      minWidth: 120,
      onRender: (i: IRawItem) => statusBadge(i.Statut)
    },
    {
      key: 'act',
      name: 'Actions',
      minWidth: 260,
      onRender: (item: IRawItem) => (
        <Stack horizontal tokens={{ childrenGap: 8 }}>
          {item.Statut === 'En Attente' && (
            <>
              <PrimaryButton text="Approuver" onClick={() => approve(item.Id)} />
              <DefaultButton text="Rejeter" onClick={() => reject(item.Id)} />
            </>
          )}
          {item.Statut === 'Approuvée' && (
            <DefaultButton text="Révoquer" onClick={() => revoke(item.Id)} />
          )}
        </Stack>
      )
    }
  ];

/* ===============================
 RENDER
================================ */

  React.useEffect(() => {
    loadData().catch(console.error);
  }, [loadData]);

  return (
    <Stack styles={{
      root: {
        background: '#f3f5f9',
        minHeight: '100vh'
      }
    }}>
      <Header
        onGoHome={onBack}               // Retour à l'accueil
        onCreateRequest={onCreateRequest} // Créer une demande (si disponible)
        // onGoAdmin non fourni → lien Tableau de bord grisé
      />

      <Stack tokens={{ childrenGap: 24 }} styles={{ root: { padding: 32 } }}>
        {/* Barre d'actions sans titre */}
        <Stack horizontal horizontalAlign="end">
          <Stack horizontal tokens={{ childrenGap: 12 }}>
            <PrimaryButton text="Retour" onClick={onBack} />
            <IconButton
              iconProps={{ iconName: 'Refresh' }}
              onClick={() => loadData().catch(console.error)}
            />
          </Stack>
        </Stack>

        {error && <MessageBar messageBarType={MessageBarType.error}>{error}</MessageBar>}

        {/* KPI cards */}
        <Stack horizontal tokens={{ childrenGap: 16 }}>
          <KpiCard title="En Attente" value={counts.enAttente} color="#FFB900" />
          <KpiCard title="Approuvées" value={counts.approuvees} color="#107c10" />
          <KpiCard title="Rejetées" value={counts.rejetees} color="#c50f1f" />
          <KpiCard title="Expirées" value={counts.expirees} color="#742774" />
        </Stack>

        {/* Graphique */}
        <Stack styles={{
          root: {
            background: '#fff',
            borderRadius: 20,
            padding: 24,
            border: '1px solid #eee',
            marginTop: 16
          }
        }}>
          <Text variant="large" styles={{ root: { fontWeight: 700, marginBottom: 16 } }}>
            Répartition des statuts
          </Text>
          <div style={{ height: 300 }}>
            <Bar data={chartData} options={chartOptions} />
          </div>
        </Stack>

        <SearchBox
          placeholder="Recherche globale"
          value={searchText}
          onChange={(_, v) => setSearchText(v ?? '')}
        />

        <DetailsList
          items={filteredRows}
          columns={columns}
          selectionMode={SelectionMode.none}
        />

        {loading && <MessageBar messageBarType={MessageBarType.info}>Chargement…</MessageBar>}
      </Stack>
    </Stack>
  );
};

export default Admin;