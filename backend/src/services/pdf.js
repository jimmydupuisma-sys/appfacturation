import PDFDocument from 'pdfkit'

function formatDate(dateStr) {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  return date.toLocaleDateString('fr-FR')
}

function formatMoney(amount) {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR'
  }).format(amount || 0).replace(/\u202F|\u00A0/g, ' ')
}

export function generateFacturePDF(facture, parametres) {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 50 })
      const chunks = []

      doc.on('data', chunk => chunks.push(chunk))
      doc.on('end', () => resolve(Buffer.concat(chunks)))
      doc.on('error', reject)

      // En-tête - Infos entreprise
      doc.fontSize(20).font('Helvetica-Bold').text(parametres?.nom_entreprise || 'Mon Entreprise', 50, 50)
      doc.fontSize(10).font('Helvetica')
      let y = 75
      if (parametres?.prenom && parametres?.nom) {
        doc.text(`${parametres.prenom} ${parametres.nom}`, 50, y)
        y += 15
      }
      if (parametres?.adresse) {
        doc.text(parametres.adresse, 50, y)
        y += 15
      }
      if (parametres?.code_postal || parametres?.ville) {
        doc.text(`${parametres.code_postal || ''} ${parametres.ville || ''}`.trim(), 50, y)
        y += 15
      }
      if (parametres?.siret) {
        doc.text(`SIRET: ${parametres.siret}`, 50, y)
        y += 15
      }
      if (parametres?.email) {
        doc.text(`Email: ${parametres.email}`, 50, y)
        y += 15
      }
      if (parametres?.telephone) {
        doc.text(`Tél: ${parametres.telephone}`, 50, y)
      }

      // Titre FACTURE
      doc.fontSize(24).font('Helvetica-Bold').text('FACTURE', 400, 50, { align: 'right' })
      doc.fontSize(12).font('Helvetica')
      doc.text(`N° ${facture.numero}`, 400, 80, { align: 'right' })
      doc.text(`Date: ${formatDate(facture.date_emission)}`, 400, 95, { align: 'right' })
      if (facture.date_paiement) {
        doc.text(`Payée le: ${formatDate(facture.date_paiement)}`, 400, 110, { align: 'right' })
      }

      // Client
      doc.fontSize(12).font('Helvetica-Bold').text('Facturé à:', 350, 160)
      doc.fontSize(11).font('Helvetica')
      y = 175
      if (facture.client_nom) {
        doc.text(facture.client_nom, 350, y)
        y += 15
      }
      if (facture.client_adresse) {
        doc.text(facture.client_adresse, 350, y)
        y += 15
      }
      if (facture.client_code_postal || facture.client_ville) {
        doc.text(`${facture.client_code_postal || ''} ${facture.client_ville || ''}`.trim(), 350, y)
        y += 15
      }
      if (facture.client_siret) {
        doc.text(`SIRET: ${facture.client_siret}`, 350, y)
      }

      // Tableau des prestations
      const tableTop = 270
      const tableHeaders = ['Description', 'Qté', 'Prix unit.', 'Total']
      const colWidths = [280, 60, 80, 80]
      const colX = [50, 330, 390, 470]

      // En-tête tableau
      doc.fillColor('#f3f4f6').rect(50, tableTop, 500, 25).fill()
      doc.fillColor('#000000').font('Helvetica-Bold').fontSize(10)
      tableHeaders.forEach((header, i) => {
        doc.text(header, colX[i], tableTop + 8, { width: colWidths[i], align: i === 0 ? 'left' : 'right' })
      })

      // Lignes
      let rowY = tableTop + 30
      let total = 0
      doc.font('Helvetica').fontSize(10)

      facture.lignes.forEach((ligne, index) => {
        const lineTotal = ligne.quantite * ligne.prix_unitaire
        total += lineTotal

        // Alternance couleur
        if (index % 2 === 1) {
          doc.fillColor('#f9fafb').rect(50, rowY - 5, 500, 20).fill()
        }
        doc.fillColor('#000000')

        doc.text(ligne.description, colX[0], rowY, { width: colWidths[0] })
        doc.text(String(ligne.quantite), colX[1], rowY, { width: colWidths[1], align: 'right' })
        doc.text(formatMoney(ligne.prix_unitaire), colX[2], rowY, { width: colWidths[2], align: 'right' })
        doc.text(formatMoney(lineTotal), colX[3], rowY, { width: colWidths[3], align: 'right' })

        rowY += 20
      })

      // Total
      rowY += 10
      doc.moveTo(50, rowY).lineTo(550, rowY).stroke()
      rowY += 15
      doc.font('Helvetica-Bold').fontSize(12)
      doc.text('TOTAL HT', colX[2], rowY, { width: colWidths[2], align: 'right' })
      doc.text(formatMoney(total), colX[3], rowY, { width: colWidths[3], align: 'right' })

      // TVA non applicable
      rowY += 30
      doc.font('Helvetica').fontSize(9).fillColor('#666666')
      doc.text('TVA non applicable, art. 293 B du CGI', 50, rowY)

      // IBAN
      if (parametres?.iban) {
        rowY += 30
        doc.fillColor('#000000').fontSize(10)
        doc.text(`Coordonnées bancaires: ${parametres.iban}`, 50, rowY)
      }

      // Notes
      if (facture.notes) {
        rowY += 30
        doc.fontSize(10).text('Notes:', 50, rowY)
        doc.fontSize(9).text(facture.notes, 50, rowY + 15)
      }

      doc.end()
    } catch (error) {
      reject(error)
    }
  })
}

export function generateDevisPDF(devis, parametres) {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 50 })
      const chunks = []

      doc.on('data', chunk => chunks.push(chunk))
      doc.on('end', () => resolve(Buffer.concat(chunks)))
      doc.on('error', reject)

      // En-tête - Infos entreprise
      doc.fontSize(20).font('Helvetica-Bold').text(parametres?.nom_entreprise || 'Mon Entreprise', 50, 50)
      doc.fontSize(10).font('Helvetica')
      let y = 75
      if (parametres?.prenom && parametres?.nom) {
        doc.text(`${parametres.prenom} ${parametres.nom}`, 50, y)
        y += 15
      }
      if (parametres?.adresse) {
        doc.text(parametres.adresse, 50, y)
        y += 15
      }
      if (parametres?.code_postal || parametres?.ville) {
        doc.text(`${parametres.code_postal || ''} ${parametres.ville || ''}`.trim(), 50, y)
        y += 15
      }
      if (parametres?.siret) {
        doc.text(`SIRET: ${parametres.siret}`, 50, y)
        y += 15
      }
      if (parametres?.email) {
        doc.text(`Email: ${parametres.email}`, 50, y)
        y += 15
      }
      if (parametres?.telephone) {
        doc.text(`Tél: ${parametres.telephone}`, 50, y)
      }

      // Titre DEVIS
      doc.fontSize(24).font('Helvetica-Bold').text('DEVIS', 400, 50, { align: 'right' })
      doc.fontSize(12).font('Helvetica')
      doc.text(`N° ${devis.numero}`, 400, 80, { align: 'right' })
      doc.text(`Date: ${formatDate(devis.date_creation)}`, 400, 95, { align: 'right' })
      if (devis.date_validite) {
        doc.text(`Valide jusqu'au: ${formatDate(devis.date_validite)}`, 400, 110, { align: 'right' })
      }

      // Client
      doc.fontSize(12).font('Helvetica-Bold').text('Client:', 350, 160)
      doc.fontSize(11).font('Helvetica')
      y = 175
      if (devis.client_nom) {
        doc.text(devis.client_nom, 350, y)
        y += 15
      }
      if (devis.client_adresse) {
        doc.text(devis.client_adresse, 350, y)
        y += 15
      }
      if (devis.client_code_postal || devis.client_ville) {
        doc.text(`${devis.client_code_postal || ''} ${devis.client_ville || ''}`.trim(), 350, y)
        y += 15
      }
      if (devis.client_siret) {
        doc.text(`SIRET: ${devis.client_siret}`, 350, y)
      }

      // Tableau des prestations
      const tableTop = 270
      const tableHeaders = ['Description', 'Qté', 'Prix unit.', 'Total']
      const colWidths = [280, 60, 80, 80]
      const colX = [50, 330, 390, 470]

      // En-tête tableau
      doc.fillColor('#f3f4f6').rect(50, tableTop, 500, 25).fill()
      doc.fillColor('#000000').font('Helvetica-Bold').fontSize(10)
      tableHeaders.forEach((header, i) => {
        doc.text(header, colX[i], tableTop + 8, { width: colWidths[i], align: i === 0 ? 'left' : 'right' })
      })

      // Lignes
      let rowY = tableTop + 30
      let total = 0
      doc.font('Helvetica').fontSize(10)

      devis.lignes.forEach((ligne, index) => {
        const lineTotal = ligne.quantite * ligne.prix_unitaire
        total += lineTotal

        if (index % 2 === 1) {
          doc.fillColor('#f9fafb').rect(50, rowY - 5, 500, 20).fill()
        }
        doc.fillColor('#000000')

        doc.text(ligne.description, colX[0], rowY, { width: colWidths[0] })
        doc.text(String(ligne.quantite), colX[1], rowY, { width: colWidths[1], align: 'right' })
        doc.text(formatMoney(ligne.prix_unitaire), colX[2], rowY, { width: colWidths[2], align: 'right' })
        doc.text(formatMoney(lineTotal), colX[3], rowY, { width: colWidths[3], align: 'right' })

        rowY += 20
      })

      // Total
      rowY += 10
      doc.moveTo(50, rowY).lineTo(550, rowY).stroke()
      rowY += 15
      doc.font('Helvetica-Bold').fontSize(12)
      doc.text('TOTAL HT', colX[2], rowY, { width: colWidths[2], align: 'right' })
      doc.text(formatMoney(total), colX[3], rowY, { width: colWidths[3], align: 'right' })

      // TVA non applicable
      rowY += 30
      doc.font('Helvetica').fontSize(9).fillColor('#666666')
      doc.text('TVA non applicable, art. 293 B du CGI', 50, rowY)

      // Notes
      if (devis.notes) {
        rowY += 30
        doc.fillColor('#000000').fontSize(10).text('Notes:', 50, rowY)
        doc.fontSize(9).text(devis.notes, 50, rowY + 15)
      }

      // Signature
      rowY += 60
      doc.fontSize(10).fillColor('#000000')
      doc.text('Bon pour accord - Date et signature du client:', 50, rowY)
      doc.rect(50, rowY + 20, 200, 60).stroke()

      doc.end()
    } catch (error) {
      reject(error)
    }
  })
}
