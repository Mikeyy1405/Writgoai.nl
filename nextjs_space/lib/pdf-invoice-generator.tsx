import React from 'react';
import { Document, Page, Text, View, StyleSheet, Image } from '@react-pdf/renderer';

// Create styles for PDF
const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontSize: 10,
    fontFamily: 'Helvetica',
    backgroundColor: '#ffffff',
  },
  header: {
    marginBottom: 30,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  logo: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#10b981',
    marginBottom: 5,
  },
  companyInfo: {
    fontSize: 9,
    color: '#6b7280',
    lineHeight: 1.4,
  },
  invoiceTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 20,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#374151',
    marginBottom: 8,
    borderBottom: '2 solid #e5e7eb',
    paddingBottom: 5,
  },
  row: {
    flexDirection: 'row',
    marginBottom: 5,
  },
  label: {
    fontSize: 10,
    color: '#6b7280',
    width: '40%',
  },
  value: {
    fontSize: 10,
    color: '#111827',
    width: '60%',
  },
  table: {
    marginTop: 20,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#f3f4f6',
    padding: 10,
    borderRadius: 4,
    marginBottom: 5,
  },
  tableRow: {
    flexDirection: 'row',
    padding: 10,
    borderBottom: '1 solid #e5e7eb',
  },
  tableCol1: {
    width: '50%',
  },
  tableCol2: {
    width: '15%',
    textAlign: 'right',
  },
  tableCol3: {
    width: '20%',
    textAlign: 'right',
  },
  tableCol4: {
    width: '15%',
    textAlign: 'right',
  },
  tableHeaderText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#374151',
  },
  tableText: {
    fontSize: 10,
    color: '#111827',
  },
  totalsSection: {
    marginTop: 20,
    marginLeft: '50%',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  totalLabel: {
    fontSize: 10,
    color: '#6b7280',
  },
  totalValue: {
    fontSize: 10,
    color: '#111827',
    fontWeight: 'bold',
  },
  grandTotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 10,
    borderTop: '2 solid #10b981',
    marginTop: 5,
  },
  grandTotalLabel: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#111827',
  },
  grandTotalValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#10b981',
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 40,
    right: 40,
    textAlign: 'center',
    fontSize: 9,
    color: '#9ca3af',
    borderTop: '1 solid #e5e7eb',
    paddingTop: 15,
  },
  paymentInfo: {
    marginTop: 30,
    padding: 15,
    backgroundColor: '#f0fdf4',
    borderRadius: 4,
    border: '1 solid #10b981',
  },
  paymentTitle: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#10b981',
    marginBottom: 8,
  },
  paymentText: {
    fontSize: 9,
    color: '#166534',
    lineHeight: 1.5,
  },
  statusBadge: {
    padding: '5 10',
    borderRadius: 4,
    fontSize: 10,
    fontWeight: 'bold',
    alignSelf: 'flex-start',
  },
  statusPaid: {
    backgroundColor: '#d1fae5',
    color: '#065f46',
  },
  statusUnpaid: {
    backgroundColor: '#fef3c7',
    color: '#92400e',
  },
  statusOverdue: {
    backgroundColor: '#fee2e2',
    color: '#991b1b',
  },
});

interface InvoiceItem {
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

interface Client {
  name: string;
  email: string;
  companyName?: string;
  website?: string;
}

interface InvoiceData {
  invoiceNumber: string;
  issueDate: string;
  dueDate: string;
  status: string;
  client: Client;
  items: InvoiceItem[];
  subtotal: number;
  taxAmount: number;
  total: number;
  notes?: string;
  paymentTerms?: string;
}

const getStatusStyle = (status: string) => {
  switch (status) {
    case 'paid':
      return styles.statusPaid;
    case 'overdue':
      return styles.statusOverdue;
    default:
      return styles.statusUnpaid;
  }
};

const getStatusLabel = (status: string) => {
  switch (status) {
    case 'paid':
      return 'BETAALD';
    case 'sent':
      return 'VERZONDEN';
    case 'overdue':
      return 'VERLOPEN';
    case 'draft':
      return 'CONCEPT';
    default:
      return status.toUpperCase();
  }
};

export const InvoicePDFDocument = ({ invoice }: { invoice: InvoiceData }) => (
  <Document>
    <Page size="A4" style={styles.page}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.logo}>WritGo AI</Text>
          <Text style={styles.companyInfo}>info@writgo.nl</Text>
          <Text style={styles.companyInfo}>www.writgoai.nl</Text>
          <Text style={styles.companyInfo}>KVK: [KVK nummer]</Text>
          <Text style={styles.companyInfo}>BTW: [BTW nummer]</Text>
        </View>
        <View style={{ alignItems: 'flex-end' }}>
          <View style={[styles.statusBadge, getStatusStyle(invoice.status)]}>
            <Text>{getStatusLabel(invoice.status)}</Text>
          </View>
        </View>
      </View>

      {/* Invoice Title */}
      <Text style={styles.invoiceTitle}>FACTUUR</Text>

      {/* Invoice Details */}
      <View style={styles.section}>
        <View style={styles.row}>
          <Text style={styles.label}>Factuurnummer:</Text>
          <Text style={styles.value}>{invoice.invoiceNumber}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Factuurdatum:</Text>
          <Text style={styles.value}>{new Date(invoice.issueDate).toLocaleDateString('nl-NL')}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Vervaldatum:</Text>
          <Text style={styles.value}>{new Date(invoice.dueDate).toLocaleDateString('nl-NL')}</Text>
        </View>
      </View>

      {/* Client Information */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Klantgegevens</Text>
        <View style={styles.row}>
          <Text style={styles.label}>Naam:</Text>
          <Text style={styles.value}>{invoice.client.name}</Text>
        </View>
        {invoice.client.companyName && (
          <View style={styles.row}>
            <Text style={styles.label}>Bedrijf:</Text>
            <Text style={styles.value}>{invoice.client.companyName}</Text>
          </View>
        )}
        <View style={styles.row}>
          <Text style={styles.label}>Email:</Text>
          <Text style={styles.value}>{invoice.client.email}</Text>
        </View>
        {invoice.client.website && (
          <View style={styles.row}>
            <Text style={styles.label}>Website:</Text>
            <Text style={styles.value}>{invoice.client.website}</Text>
          </View>
        )}
      </View>

      {/* Invoice Items Table */}
      <View style={styles.table}>
        <View style={styles.tableHeader}>
          <Text style={[styles.tableHeaderText, styles.tableCol1]}>Omschrijving</Text>
          <Text style={[styles.tableHeaderText, styles.tableCol2]}>Aantal</Text>
          <Text style={[styles.tableHeaderText, styles.tableCol3]}>Prijs per stuk</Text>
          <Text style={[styles.tableHeaderText, styles.tableCol4]}>Totaal</Text>
        </View>
        {invoice.items.map((item, index) => (
          <View key={index} style={styles.tableRow}>
            <Text style={[styles.tableText, styles.tableCol1]}>{item.description}</Text>
            <Text style={[styles.tableText, styles.tableCol2]}>{item.quantity}</Text>
            <Text style={[styles.tableText, styles.tableCol3]}>€{item.unitPrice.toFixed(2)}</Text>
            <Text style={[styles.tableText, styles.tableCol4]}>€{item.total.toFixed(2)}</Text>
          </View>
        ))}
      </View>

      {/* Totals */}
      <View style={styles.totalsSection}>
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Subtotaal:</Text>
          <Text style={styles.totalValue}>€{invoice.subtotal.toFixed(2)}</Text>
        </View>
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>BTW (21%):</Text>
          <Text style={styles.totalValue}>€{invoice.taxAmount.toFixed(2)}</Text>
        </View>
        <View style={styles.grandTotalRow}>
          <Text style={styles.grandTotalLabel}>Totaal:</Text>
          <Text style={styles.grandTotalValue}>€{invoice.total.toFixed(2)}</Text>
        </View>
      </View>

      {/* Payment Information */}
      {invoice.status !== 'paid' && (
        <View style={styles.paymentInfo}>
          <Text style={styles.paymentTitle}>Betaalinformatie</Text>
          <Text style={styles.paymentText}>
            Betaal deze factuur eenvoudig online via de betaallink die u heeft ontvangen per email.
          </Text>
          <Text style={styles.paymentText}>
            {invoice.paymentTerms || 'Betaling binnen 14 dagen na factuurdatum.'}
          </Text>
        </View>
      )}

      {/* Notes */}
      {invoice.notes && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Opmerkingen</Text>
          <Text style={styles.value}>{invoice.notes}</Text>
        </View>
      )}

      {/* Footer */}
      <Text style={styles.footer}>
        WritGo AI - Uw AI Content Partner | info@writgo.nl | www.writgoai.nl
        {"\n"}Bedankt voor uw vertrouwen!
      </Text>
    </Page>
  </Document>
);
