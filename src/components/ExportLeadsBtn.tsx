"use client";

import styles from '@/app/admin/dashboard.module.css';

interface ExportLeadsBtnProps {
  leads: any[];
}

export default function ExportLeadsBtn({ leads }: ExportLeadsBtnProps) {
  const exportToCSV = () => {
    if (!leads || leads.length === 0) return;

    const headers = ['ID', 'Nome', 'Email', 'WhatsApp', 'Evento Origem', 'Data'];
    const csvRows = [
      headers.join(','),
      ...leads.map(lead => [
        lead.id,
        `"${lead.name}"`,
        lead.email,
        lead.whatsapp || '',
        lead.source_event_slug || '',
        new Date(lead.created_at).toLocaleDateString('pt-BR')
      ].join(','))
    ];

    const csvContent = csvRows.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `leads-4dance-${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <button 
      onClick={exportToCSV}
      className={styles.exportBtn}
      disabled={!leads || leads.length === 0}
    >
      📂 Exportar CSV (Excel)
    </button>
  );
}
