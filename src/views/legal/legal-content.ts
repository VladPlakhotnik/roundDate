import { contactEmail } from "@/shared/config/contact";

export type LegalPageSlug = "privacy" | "regulamin";

export type LegalSection = {
  body?: string[];
  id: string;
  items?: string[];
  title: string;
};

export type LegalPageContent = {
  badge: string;
  lead: string;
  sections: LegalSection[];
  slug: LegalPageSlug;
  summary: {
    label: string;
    value: string;
  }[];
  title: string;
};

export const legalPages = {
  regulamin: {
    badge: "Regulamin usługi",
    lead: "Zasady korzystania z RoundDate, rezerwacji miejsc na wydarzenia offline oraz publikacji wyników dopasowań po spotkaniu.",
    sections: [
      {
        body: [
          "RoundDate organizuje kameralne wydarzenia offline dla osób, które chcą poznawać nowe osoby w bezpiecznym i uporządkowanym formacie.",
          `Kontakt z organizatorem odbywa się pod adresem ${contactEmail}. Informacje o dacie, miejscu, cenie, limicie miejsc i grupie wiekowej są każdorazowo widoczne w opisie konkretnego wydarzenia.`,
        ],
        id: "organizator",
        title: "Organizator i kontakt",
      },
      {
        body: [
          "Użytkownik może korzystać z serwisu jako gość albo po utworzeniu konta. Konto pozwala zarządzać rezerwacjami, profilem, powiadomieniami i wynikami wydarzeń.",
          "Dane podane przy rejestracji powinny być prawdziwe i aktualne. Użytkownik odpowiada za poufność dostępu do swojego konta oraz za aktywność wykonaną z użyciem tego konta.",
        ],
        id: "konto",
        title: "Konto użytkownika",
      },
      {
        items: [
          "Udział w wydarzeniu jest przeznaczony dla osób pełnoletnich.",
          "Uczestnik powinien spełniać kryteria wskazane przy wydarzeniu, w szczególności przedział wiekowy i typ spotkania.",
          "Organizator może poprosić o potwierdzenie tożsamości lub wieku przed wejściem na wydarzenie.",
          "Spóźnienie może ograniczyć możliwość udziału, jeżeli zakłóciłoby przebieg rund spotkań.",
        ],
        id: "udzial",
        title: "Udział w wydarzeniach",
      },
      {
        body: [
          "Rezerwacja miejsca następuje po wyborze wydarzenia, podaniu wymaganych danych i opłaceniu udziału, jeżeli wydarzenie jest płatne. Status płatności jest zapisywany w profilu użytkownika.",
          "Jeżeli wydarzenie zostanie odwołane przez organizatora, uczestnik otrzyma informację e-mail i możliwość zwrotu środków albo przeniesienia rezerwacji na inny termin. Zasady rezygnacji uczestnika mogą zależeć od konkretnego wydarzenia i będą wskazane przy zakupie lub w potwierdzeniu rezerwacji.",
        ],
        id: "platnosci",
        title: "Rezerwacje, płatności i odwołania",
      },
      {
        body: [
          "Po wydarzeniu organizator może opublikować wyniki dopasowań w profilu użytkownika. Dopasowanie powstaje tylko wtedy, gdy obie osoby wzajemnie wyraziły chęć dalszego kontaktu.",
          "RoundDate nie gwarantuje liczby dopasowań ani dalszego kontaktu poza wydarzeniem. Jeżeli uczestnik nie uzyska dopasowań, informacja o wyniku nadal może zostać przekazana w profilu i drogą e-mail.",
        ],
        id: "dopasowania",
        title: "Dopasowania i przekazywanie kontaktów",
      },
      {
        items: [
          "Uczestnicy traktują siebie z szacunkiem i nie wywierają presji na podanie prywatnych danych.",
          "Niedopuszczalne są zachowania agresywne, obraźliwe, nękanie, nagrywanie bez zgody lub udział pod wpływem substancji zakłócających bezpieczeństwo spotkania.",
          "Organizator może odmówić udziału albo poprosić uczestnika o opuszczenie wydarzenia, jeżeli jego zachowanie narusza komfort lub bezpieczeństwo innych osób.",
          "Zdjęcia i materiały promocyjne mogą być publikowane tylko na podstawie odrębnej zgody osób widocznych w materiale.",
        ],
        id: "bezpieczenstwo",
        title: "Bezpieczeństwo i zasady zachowania",
      },
      {
        body: [
          `Reklamacje dotyczące działania serwisu, płatności lub przebiegu wydarzenia można wysłać na ${contactEmail}. W wiadomości warto wskazać wydarzenie, datę i opis sytuacji.`,
          "Odpowiedź zostanie udzielona w rozsądnym terminie, co do zasady do 14 dni od otrzymania kompletnego zgłoszenia.",
        ],
        id: "reklamacje",
        title: "Reklamacje",
      },
      {
        body: [
          "Regulamin może być aktualizowany, gdy zmieniają się funkcje serwisu, sposób organizacji wydarzeń lub wymagania prawne. Aktualna wersja jest publikowana na tej stronie.",
          "Zmiany nie ograniczają praw nabytych przez uczestnika dla już opłaconego wydarzenia, chyba że wynika to z przepisów prawa lub jest konieczne ze względów bezpieczeństwa.",
        ],
        id: "zmiany",
        title: "Zmiany regulaminu",
      },
    ],
    slug: "regulamin",
    summary: [
      { label: "Dla kogo", value: "osoby pełnoletnie spełniające warunki wydarzenia" },
      { label: "Kontakt", value: contactEmail },
      { label: "Wyniki", value: "publikowane po zatwierdzeniu przez organizatora" },
    ],
    title: "Regulamin RoundDate",
  },
  privacy: {
    badge: "Polityka prywatności",
    lead: "Informacje o tym, jakie dane przetwarza RoundDate, w jakim celu, na jakiej podstawie i jak można skorzystać ze swoich praw.",
    sections: [
      {
        body: [
          `Administratorem danych osobowych jest RoundDate. W sprawach dotyczących prywatności można skontaktować się przez ${contactEmail}.`,
          "Polityka dotyczy korzystania z serwisu rounddate.pl, konta użytkownika, zapisów na wydarzenia, newslettera oraz komunikacji związanej z wydarzeniami.",
        ],
        id: "administrator",
        title: "Administrator danych i kontakt",
      },
      {
        items: [
          "Dane konta: e-mail, imię, nazwisko lub nazwa profilu, zdjęcie z logowania społecznościowego, identyfikator użytkownika.",
          "Dane profilu i wydarzeń: wiek, płeć, preferencje, zapisy, obecność, notatki organizacyjne i wyniki dopasowań.",
          "Dane płatności: status płatności, identyfikatory transakcji i informacje potrzebne do obsługi zwrotów. Pełne dane karty obsługuje operator płatności.",
          "Dane komunikacyjne: zgody na powiadomienia, historia wysłanych wiadomości e-mail, zgłoszenia kontaktowe i reklamacje.",
          "Dane techniczne: podstawowe logi bezpieczeństwa, adres IP, informacje o urządzeniu i zdarzeniach w aplikacji.",
        ],
        id: "dane",
        title: "Jakie dane przetwarzamy",
      },
      {
        items: [
          "Utworzenie konta, obsługa profilu i rezerwacji: wykonanie umowy lub działania przed jej zawarciem.",
          "Organizacja wydarzenia, przypomnienia i publikacja wyników: wykonanie usługi oraz uzasadniony interes organizatora w prawidłowym przeprowadzeniu spotkania.",
          "Płatności, rozliczenia i obowiązki księgowe: obowiązek prawny oraz wykonanie umowy.",
          "Bezpieczeństwo serwisu, przeciwdziałanie nadużyciom i obsługa reklamacji: uzasadniony interes administratora.",
          "Newsletter i marketing nowych wydarzeń: zgoda użytkownika, którą można wycofać w dowolnym momencie.",
        ],
        id: "cele",
        title: "Cele i podstawy prawne",
      },
      {
        body: [
          "Wysyłamy wiadomości niezbędne do obsługi konta i wydarzenia, na przykład potwierdzenie e-mail, reset hasła, przypomnienie o wydarzeniu oraz informację o wynikach.",
          `Newsletter o nowych wydarzeniach wysyłamy tylko osobom, które podały dane w formularzu zapisu albo wyraziły zgodę marketingową. W każdej chwili można wycofać zgodę, pisząc na ${contactEmail}.`,
        ],
        id: "newsletter",
        title: "Newsletter i zgody marketingowe",
      },
      {
        body: [
          "Dane mogą być przekazywane dostawcom, którzy pomagają utrzymać serwis, bazę danych, wysyłkę wiadomości e-mail, płatności i hosting. Korzystają oni z danych wyłącznie w zakresie potrzebnym do realizacji usługi dla RoundDate.",
          "W praktyce może to obejmować dostawcę poczty transakcyjnej, operatora płatności, hosting aplikacji, bazę danych oraz narzędzia bezpieczeństwa i logowania.",
        ],
        id: "odbiorcy",
        title: "Odbiorcy danych",
      },
      {
        body: [
          "Dane konta przechowujemy przez czas korzystania z konta, a po jego usunięciu tylko tak długo, jak jest to potrzebne do rozliczeń, reklamacji, bezpieczeństwa lub obrony roszczeń.",
          "Dane księgowe i płatnicze przechowujemy przez okres wymagany przepisami. Dane newsletterowe przechowujemy do momentu wycofania zgody lub skutecznego wypisu.",
        ],
        id: "przechowywanie",
        title: "Jak długo przechowujemy dane",
      },
      {
        body: [
          "Serwis używa plików cookies i podobnych technologii potrzebnych do działania strony, logowania, bezpieczeństwa i zapamiętania podstawowych ustawień.",
          "Jeżeli włączone są narzędzia analityczne Google, uruchamiamy je w trybie ograniczonym z domyślnie wyłączonym przechowywaniem danych reklamowych i analitycznych do czasu uzyskania właściwej zgody.",
        ],
        id: "cookies",
        title: "Pliki cookies i podobne technologie",
      },
      {
        body: [
          "Użytkownik może żądać dostępu do danych, sprostowania, usunięcia, ograniczenia przetwarzania, przeniesienia danych, wnieść sprzeciw oraz wycofać zgodę, jeżeli przetwarzanie opiera się na zgodzie.",
          `Żądanie można wysłać na ${contactEmail}. Użytkownik ma także prawo złożyć skargę do Prezesa Urzędu Ochrony Danych Osobowych.`,
        ],
        id: "prawa",
        title: "Prawa użytkownika",
      },
    ],
    slug: "privacy",
    summary: [
      { label: "Administrator", value: "RoundDate" },
      { label: "Kontakt privacy", value: contactEmail },
      { label: "Marketing", value: "tylko za zgodą lub po zapisie na newsletter" },
    ],
    title: "Polityka prywatności",
  },
} satisfies Record<LegalPageSlug, LegalPageContent>;
