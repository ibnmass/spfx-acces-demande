import * as React from 'react';
import { Icon, IconButton } from '@fluentui/react';

interface IHeaderProps {
  onCreateRequest?: () => void; // clic sur "Nouvelle demande"
  onGoAdmin?: () => void;       // clic sur "Tableau de bord"
  onGoHome?: () => void;        // clic sur "Accueil"
}

const Header: React.FC<IHeaderProps> = ({ onCreateRequest, onGoAdmin, onGoHome }): JSX.Element => {
  const linkBase: React.CSSProperties = {
    fontSize: 12,
    fontWeight: 900,
    letterSpacing: '0.15em',
    textTransform: 'uppercase',
    color: '#616161',
    cursor: 'pointer',
  };

  const linkDisabledStyle: React.CSSProperties = {
    opacity: 0.5,
    cursor: 'default',
    pointerEvents: 'none',
  };

  return (
    <div
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 100,
        background: 'rgba(255,255,255,0.92)',
        backdropFilter: 'blur(8px)',
        borderBottom: '1px solid #eee',
      }}
    >
      <div
        style={{
          height: 64,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 16px',
          maxWidth: 1200,
          margin: '0 auto',
        }}
      >
        {/* Logo + Marque */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span
            style={{
              width: 34,
              height: 34,
              borderRadius: 10,
              background: '#c50f1f',
              display: 'grid',
              placeItems: 'center',
              color: '#fff',
              boxShadow: '0 12px 24px rgba(197,15,31,.2)',
            }}
          >
            <Icon iconName="LockSolid" />
          </span>

          <span style={{ fontWeight: 900, fontSize: 20, letterSpacing: 0.2, color: '#323130' }}>
            Acces<span style={{ color: '#c50f1f' }}>Demande</span>
          </span>
        </div>

        {/* Navigation */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 26 }}>
          {/* Lien Accueil */}
          <span
            style={{
              ...linkBase,
              ...(!onGoHome ? linkDisabledStyle : {}),
            }}
            onClick={onGoHome}
            title={onGoHome ? "Retour à l'accueil" : undefined}
          >
            Accueil
          </span>

          {/* Tableau de bord */}
          <span
            style={{
              ...linkBase,
              ...(!onGoAdmin ? linkDisabledStyle : {}),
            }}
            onClick={onGoAdmin}
            title={onGoAdmin ? 'Administration' : undefined}
          >
            Tableau de bord
          </span>

          {/* Nouvelle demande */}
          <span
            style={{
              ...linkBase,
              ...(!onCreateRequest ? linkDisabledStyle : {}),
            }}
            onClick={onCreateRequest}
            title={onCreateRequest ? 'Créer une demande' : undefined}
          >
            Nouvelle demande
          </span>
        </div>

        {/* Actions à droite */}
        <div>
          <IconButton iconProps={{ iconName: 'Contact' }} aria-label="Profil" />
        </div>
      </div>
    </div>
  );
};

export default Header;