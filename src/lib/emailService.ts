import nodemailer from 'nodemailer';
import {getEquipment} from './equipmentStore';
import {calculateDueDetails} from './procedureUtils';
import {Equipment} from '@/types/equipment';
import {Procedure} from '@/types/procedure';

interface DashboardEmailItem {
    equipmentName: string;
    procedureName: string;
    intervalDays: number;
    daysTillDue: number | 'N/A';
    dueDate: string;
    status: string;
}

export async function sendDashboardEmail() {
    const recipient = "mr.paul.woods@gmail.com";

    // Email configuration using Gmail
    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.APP_SMTP_USER,
            pass: process.env.APP_SMTP_PASS,
        },
    });

    const allEquipment = await getEquipment();
    const flattened: DashboardEmailItem[] = [];

    allEquipment.forEach((eq: Equipment) => {
        if (eq.procedures) {
            eq.procedures.forEach((proc: Procedure) => {
                const due = calculateDueDetails(proc);
                flattened.push({
                    equipmentName: `${eq.manufacturer} ${eq.modelNumber}`,
                    procedureName: proc.name,
                    intervalDays: proc.intervalDays,
                    daysTillDue: due?.daysTillDue ?? 'N/A',
                    dueDate: due?.dueDate ? new Date(due.dueDate).toLocaleDateString() : 'N/A',
                    status: (due?.daysTillDue ?? 1) <= 0 ? 'OVERDUE' : (due ? 'Upcoming' : 'No history')
                });
            });
        }
    });

    // Sort by days till due, similar to dashboard
    flattened.sort((a, b) => {
        if (a.daysTillDue === 'N/A' && b.daysTillDue !== 'N/A') return -1;
        if (a.daysTillDue !== 'N/A' && b.daysTillDue === 'N/A') return 1;
        if (a.daysTillDue === 'N/A' && b.daysTillDue === 'N/A') return 0;
        return (a.daysTillDue as number) - (b.daysTillDue as number);
    });

    const tableRows = flattened.map(item => `
        <tr style="border-bottom: 1px solid #ddd;">
            <td style="padding: 8px;">${item.equipmentName}</td>
            <td style="padding: 8px;">${item.procedureName}</td>
            <td style="padding: 8px;">${item.intervalDays}</td>
            <td style="padding: 8px; color: ${item.status === 'OVERDUE' ? 'red' : 'inherit'}">${item.daysTillDue}</td>
            <td style="padding: 8px;">${item.dueDate}</td>
            <td style="padding: 8px;">${item.status}</td>
        </tr>
    `).join('');

    const html = `
        <h1>Equipment Maintenance Dashboard</h1>
        <p>Current dashboard status as of ${new Date().toLocaleString()}</p>
        <table style="width: 100%; border-collapse: collapse;">
            <thead>
                <tr style="background-color: #f2f2f2; text-align: left;">
                    <th style="padding: 8px;">Equipment</th>
                    <th style="padding: 8px;">Procedure</th>
                    <th style="padding: 8px;">Interval (Days)</th>
                    <th style="padding: 8px;">Days Till Due</th>
                    <th style="padding: 8px;">Due Date</th>
                    <th style="padding: 8px;">Status</th>
                </tr>
            </thead>
            <tbody>
                ${tableRows}
            </tbody>
        </table>
    `;

    await transporter.sendMail({
        from: process.env.APP_SMTP_FROM || '"Equipment Management" <mr.paul.woods@gmail.com>',
        to: recipient,
        subject: `Equipment Maintenance Dashboard - ${new Date().toLocaleDateString()}`,
        html: html,
    });
}
