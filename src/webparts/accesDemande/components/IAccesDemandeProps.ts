import { SPHttpClient, MSGraphClientFactory } from '@microsoft/sp-http';

export interface IAccesDemandeProps {
  description: string;
  isDarkTheme: boolean;
  environmentMessage: string;
  hasTeamsContext: boolean;
  userDisplayName: string;

  // 👇 Ajout pour la sécurité Admin
  userEmail: string;

  // Contexte pour PeoplePicker
  webAbsoluteUrl: string;
  spHttpClient: SPHttpClient;
  msGraphClientFactory: MSGraphClientFactory;
}