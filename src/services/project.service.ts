import { db } from '@/lib/db';
import { InvoiceService } from './invoice.service';

export interface CreateProjectInput {
  workspaceId?: string;
  customerId: string;
  name: string;
  description?: string;
  billingType?: 'milestone' | 'fixed' | 'hourly' | 'retainer';
  totalBudget?: number;
  hourlyRate?: number;
  status?: 'active' | 'completed' | 'archived';
  startDate?: string;
  endDate?: string;
  milestones?: Array<{
    title: string;
    description?: string;
    amount: number;
    percentage?: number;
    dueDate?: string;
  }>;
}

const memoryProjectsStore: any[] = [];

export class ProjectService {
  private static sanitizeId(input?: string): string | undefined {
    if (!input || typeof input !== 'string') return undefined;
    const clean = input.trim();
    return clean.length > 0 && /^[a-zA-Z0-9_-]+$/.test(clean) ? clean : undefined;
  }

  static async getAllProjects(workspaceId?: string) {
    const sanitizedWsId = ProjectService.sanitizeId(workspaceId);

    try {
      const projects = await db.project.findMany({
        where: sanitizedWsId ? { workspaceId: sanitizedWsId } : undefined,
        orderBy: { createdAt: 'desc' },
        include: {
          customer: true,
          milestones: {
            orderBy: { createdAt: 'asc' },
          },
          invoices: {
            select: {
              id: true,
              invoiceNumber: true,
              status: true,
              total: true,
              issueDate: true,
            },
          },
        },
      });

      const result = [];
      for (let i = 0; i < projects.length; i++) {
        const proj = projects[i];
        let billedAmount = 0;

        const invList = proj.invoices;
        const formattedInvoices = [];
        for (let j = 0; j < invList.length; j++) {
          const inv = invList[j];
          const tot = Number(inv.total || 0);
          if (inv.status.toLowerCase() !== 'cancelled') {
            billedAmount += tot;
          }
          formattedInvoices.push({
            id: inv.id,
            invoiceNumber: inv.invoiceNumber,
            status: inv.status,
            totalAmount: tot,
            issueDate: inv.issueDate ? inv.issueDate.toISOString() : undefined,
          });
        }

        const totalB = Number(proj.totalBudget || 0);
        const percentBilled = totalB > 0 ? Math.min(Math.round((billedAmount / totalB) * 100), 100) : 0;

        const msList = proj.milestones;
        const formattedMilestones = [];
        for (let k = 0; k < msList.length; k++) {
          const m = msList[k];
          formattedMilestones.push({
            id: m.id,
            title: m.title,
            description: m.description || '',
            amount: Number(m.amount),
            percentage: Number(m.percentage),
            status: m.status as 'pending' | 'in_progress' | 'completed' | 'billed',
            dueDate: m.dueDate ? m.dueDate.toISOString() : undefined,
            invoiceId: m.invoiceId || undefined,
          });
        }

        result.push({
          id: proj.id,
          workspaceId: proj.workspaceId,
          customerId: proj.customerId,
          customer: proj.customer,
          name: proj.name,
          description: proj.description || '',
          billingType: proj.billingType as 'milestone' | 'fixed' | 'hourly' | 'retainer',
          totalBudget: totalB,
          hourlyRate: proj.hourlyRate ? Number(proj.hourlyRate) : 0,
          status: proj.status as 'active' | 'completed' | 'archived',
          startDate: proj.startDate ? proj.startDate.toISOString() : undefined,
          endDate: proj.endDate ? proj.endDate.toISOString() : undefined,
          billedAmount,
          percentBilled,
          milestones: formattedMilestones,
          invoices: formattedInvoices,
        });
      }

      const filteredMem = memoryProjectsStore.filter((p) => !sanitizedWsId || p.workspaceId === sanitizedWsId);
      return [...result, ...filteredMem];
    } catch {
      return memoryProjectsStore.filter((p) => !sanitizedWsId || p.workspaceId === sanitizedWsId);
    }
  }

  static async getProjectById(id: string) {
    const sanitizedId = ProjectService.sanitizeId(id);

    try {
      if (sanitizedId) {
        const proj = await db.project.findUnique({
          where: { id: sanitizedId },
          include: {
            customer: true,
            milestones: {
              orderBy: { createdAt: 'asc' },
            },
            invoices: {
              include: {
                items: true,
              },
            },
          },
        }).catch(() => null);

        if (proj) {
          let billedAmount = 0;
          const invList = proj.invoices;
          for (let i = 0; i < invList.length; i++) {
            const inv = invList[i];
            if (inv.status.toLowerCase() !== 'cancelled') {
              billedAmount += Number(inv.total || 0);
            }
          }

          const totalB = Number(proj.totalBudget || 0);
          const percentBilled = totalB > 0 ? Math.min(Math.round((billedAmount / totalB) * 100), 100) : 0;

          const msList = proj.milestones;
          const formattedMilestones = [];
          for (let j = 0; j < msList.length; j++) {
            const m = msList[j];
            formattedMilestones.push({
              id: m.id,
              title: m.title,
              description: m.description || '',
              amount: Number(m.amount),
              percentage: Number(m.percentage),
              status: m.status as 'pending' | 'in_progress' | 'completed' | 'billed',
              dueDate: m.dueDate ? m.dueDate.toISOString() : undefined,
              invoiceId: m.invoiceId || undefined,
            });
          }

          return {
            id: proj.id,
            workspaceId: proj.workspaceId,
            customerId: proj.customerId,
            customer: proj.customer,
            name: proj.name,
            description: proj.description || '',
            billingType: proj.billingType as 'milestone' | 'fixed' | 'hourly' | 'retainer',
            totalBudget: totalB,
            hourlyRate: proj.hourlyRate ? Number(proj.hourlyRate) : 0,
            status: proj.status as 'active' | 'completed' | 'archived',
            startDate: proj.startDate ? proj.startDate.toISOString() : undefined,
            endDate: proj.endDate ? proj.endDate.toISOString() : undefined,
            billedAmount,
            percentBilled,
            milestones: formattedMilestones,
          };
        }
      }
    } catch {}

    const foundMem = memoryProjectsStore.find((p) => p.id === sanitizedId || p.id === id);
    if (foundMem) return foundMem;
    return null;
  }

  static async createProject(input: CreateProjectInput) {
    const customerId = ProjectService.sanitizeId(input.customerId) || 'cust-default-1';
    let workspaceId = ProjectService.sanitizeId(input.workspaceId) || 'ws-default-1';
    const totalBudget = Math.max(0, input.totalBudget || 0);

    const milestonesData = (input.milestones || []).map((m, idx) => {
      const amount = Math.max(0, m.amount || 0);
      const percentage = m.percentage || (totalBudget > 0 ? (amount / totalBudget) * 100 : 0);
      return {
        id: `ms-${Date.now()}-${idx}`,
        title: m.title.slice(0, 255),
        description: m.description ? m.description.slice(0, 1000) : '',
        amount,
        percentage,
        dueDate: m.dueDate ? new Date(m.dueDate) : null,
        status: 'pending',
      };
    });

    try {
      const created = await db.project.create({
        data: {
          workspaceId,
          customerId,
          name: input.name.slice(0, 255),
          description: input.description ? input.description.slice(0, 2000) : null,
          billingType: input.billingType || 'milestone',
          totalBudget,
          hourlyRate: input.hourlyRate || 0,
          status: input.status || 'active',
          startDate: input.startDate ? new Date(input.startDate) : null,
          endDate: input.endDate ? new Date(input.endDate) : null,
          milestones: {
            create: milestonesData.map(({ id, ...m }) => m),
          },
        },
        include: {
          customer: true,
          milestones: true,
        },
      });
      memoryProjectsStore.unshift(created);
      return created;
    } catch {
      const newProj = {
        id: `proj-${Date.now()}`,
        workspaceId,
        customerId,
        customer: { id: customerId, name: 'Pelanggan Project' },
        name: input.name,
        description: input.description || '',
        billingType: input.billingType || 'milestone',
        totalBudget,
        hourlyRate: input.hourlyRate || 0,
        status: input.status || 'active',
        billedAmount: 0,
        percentBilled: 0,
        milestones: milestonesData,
        invoices: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      memoryProjectsStore.unshift(newProj);
      return newProj;
    }
  }

  static async updateProject(id: string, data: Partial<CreateProjectInput>) {
    const sanitizedId = ProjectService.sanitizeId(id);
    if (!sanitizedId) throw new Error('Invalid project ID');

    try {
      return await db.project.update({
        where: { id: sanitizedId },
        data: {
          ...(data.name && { name: data.name.slice(0, 255) }),
          ...(data.description !== undefined && { description: data.description ? data.description.slice(0, 2000) : null }),
          ...(data.billingType && { billingType: data.billingType }),
          ...(data.totalBudget !== undefined && { totalBudget: Math.max(0, data.totalBudget) }),
          ...(data.hourlyRate !== undefined && { hourlyRate: Math.max(0, data.hourlyRate) }),
          ...(data.status && { status: data.status }),
          ...(data.startDate && { startDate: new Date(data.startDate) }),
          ...(data.endDate && { endDate: new Date(data.endDate) }),
        },
        include: {
          customer: true,
          milestones: true,
        },
      });
    } catch {
      const proj = memoryProjectsStore.find((p) => p.id === sanitizedId);
      if (proj) {
        if (data.name) proj.name = data.name;
        if (data.description !== undefined) proj.description = data.description;
        if (data.billingType) proj.billingType = data.billingType;
        if (data.totalBudget !== undefined) proj.totalBudget = data.totalBudget;
        return proj;
      }
      throw new Error('Project not found');
    }
  }

  static async deleteProject(id: string) {
    const sanitizedId = ProjectService.sanitizeId(id);
    if (!sanitizedId) throw new Error('Invalid project ID');
    try {
      return await db.project.delete({
        where: { id: sanitizedId },
      });
    } catch {
      const idx = memoryProjectsStore.findIndex((p) => p.id === sanitizedId);
      if (idx !== -1) memoryProjectsStore.splice(idx, 1);
      return { id: sanitizedId };
    }
  }

  static async createInvoiceFromProject(projectId: string, milestoneId?: string) {
    const sanitizedProjId = ProjectService.sanitizeId(projectId);
    if (!sanitizedProjId) throw new Error('Invalid project ID');
    const sanitizedMsId = ProjectService.sanitizeId(milestoneId);

    const project = await ProjectService.getProjectById(sanitizedProjId);

    if (!project) {
      throw new Error('Project not found');
    }

    const year = new Date().getFullYear();
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const invoiceNumber = `INV-${year}-${randomSuffix}`;
    const dueDate = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    const items: Array<{ description: string; quantity: number; unitPrice: number }> = [];

    if (sanitizedMsId) {
      const milestone = project.milestones?.find((m: any) => m.id === sanitizedMsId);
      if (milestone) {
        items.push({
          description: `Penagihan Termin: ${milestone.title} (${project.name})`,
          quantity: 1,
          unitPrice: Number(milestone.amount),
        });

        milestone.status = 'billed';
      }
    } else {
      if (project.billingType === 'hourly') {
        items.push({
          description: `Layanan Jam Kerja Project: ${project.name}`,
          quantity: 10,
          unitPrice: Number(project.hourlyRate || 150000),
        });
      } else if (project.billingType === 'retainer') {
        items.push({
          description: `Layanan Retainer Bulanan Project: ${project.name}`,
          quantity: 1,
          unitPrice: Number(project.totalBudget || 5000000),
        });
      } else {
        items.push({
          description: `Penagihan Full Project: ${project.name}`,
          quantity: 1,
          unitPrice: Number(project.totalBudget || 10000000),
        });
      }
    }

    const createdInvoice = await InvoiceService.createInvoice({
      workspaceId: project.workspaceId,
      customerId: project.customerId,
      invoiceNumber,
      dueDate,
      taxRate: 11,
      discount: 0,
      notes: `Invoice diterbitkan otomatis dari Project ${project.name}. Terima kasih atas kerja sama Anda.`,
      items,
    });

    return createdInvoice;
  }
}
