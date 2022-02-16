using Academy.Server.Data.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace Academy.Server.Data
{
    public class UnitOfWork<TDbContext> : IUnitOfWork, IDisposable
        where TDbContext : DbContext
    {
        private readonly TDbContext context;

        public UnitOfWork(IServiceProvider serviceProvider)
        {
            context = serviceProvider.GetRequiredService<TDbContext>();
        }

        public async Task CreateAsync<TEntity>(params TEntity[] entities)
            where TEntity : class, IEntity
        {
            await context.AddRangeAsync(entities);
            await context.SaveChangesAsync();

            foreach (var entity in entities)
                context.Entry(entity).State = EntityState.Detached;
        }

        public Task CreateAsync<TEntity>(IEnumerable<TEntity> entities)
            where TEntity : class, IEntity
        {
            return CreateAsync(entities.ToArray());
        }

        public async Task UpdateAsync<TEntity>(params TEntity[] entities)
            where TEntity : class, IEntity
        {
            foreach (var entity in entities)
                context.Entry(entity).State = EntityState.Modified;

            await context.SaveChangesAsync();

            foreach (var entity in entities)
                context.Entry(entity).State = EntityState.Detached;
        }

        public async Task UpdateCollectionAsync<TEntity>(ICollection<TEntity> currentItems, ICollection<TEntity> newItems, Func<TEntity, int> keyFunc)
                    where TEntity : class, IEntity
        {
            var itemToDelete = currentItems.Where(currentItem => !newItems.Any(newItem => keyFunc(currentItem) == keyFunc(newItem))).ToList();
            var itemsToUpdate = newItems.Where(newItem => currentItems.Any(currentItem => keyFunc(newItem) == keyFunc(currentItem))).ToList();
            var itemsToCreate = newItems.Where(newItem => !currentItems.Any(currentItem => keyFunc(newItem) == keyFunc(currentItem))).ToList();

            await DeleteAsync(itemToDelete);
            await UpdateAsync(itemsToUpdate);
            await CreateAsync(itemsToCreate);
        }

        public Task UpdateAsync<TEntity>(IEnumerable<TEntity> entities)
            where TEntity : class, IEntity
        {
            return UpdateAsync(entities.ToArray());
        }

        public async Task DeleteAsync<TEntity>(params TEntity[] entities)
            where TEntity : class, IEntity
        {
            context.RemoveRange(entities);
            await context.SaveChangesAsync();
        }

        public Task DeleteAsync<TEntity>(IEnumerable<TEntity> entities)
            where TEntity : class, IEntity
        {
            return DeleteAsync(entities.ToArray());
        }

        public Task<TEntity> FindAsync<TEntity>(params object[] keyValues)
              where TEntity : class, IEntity
        {
            return context.FindAsync<TEntity>(keyValues).AsTask();
        }

        public IQueryable<TEntity> Query<TEntity>()
            where TEntity : class, IEntity
        {
            return context.Set<TEntity>();
        }

        public DbContext Context => context;

        private bool _disposed;
        protected virtual void Dispose(bool disposing)
        {
            if (!_disposed)
            {
                if (disposing)
                {
                    context.Dispose();
                }

                // TODO: free unmanaged resources (unmanaged objects) and override finalizer
                // TODO: set large fields to null
                _disposed = true;
            }
        }

        ~UnitOfWork()
        {
            Dispose(disposing: false);
        }

        public void Dispose()
        {
            Dispose(disposing: true);
            GC.SuppressFinalize(this);
        }
    }

    public interface IUnitOfWork
    {
        Task CreateAsync<TEntity>(params TEntity[] entities)
            where TEntity : class, IEntity;

        Task CreateAsync<TEntity>(IEnumerable<TEntity> entities)
            where TEntity : class, IEntity;

        Task UpdateAsync<TEntity>(params TEntity[] entities)
            where TEntity : class, IEntity;

        Task UpdateCollectionAsync<TEntity>(ICollection<TEntity> currentItems, ICollection<TEntity> newItems, Func<TEntity, int> keyFunc)
            where TEntity : class, IEntity;

        Task UpdateAsync<TEntity>(IEnumerable<TEntity> entities)
            where TEntity : class, IEntity;

        Task DeleteAsync<TEntity>(params TEntity[] entities)
            where TEntity : class, IEntity;

        Task DeleteAsync<TEntity>(IEnumerable<TEntity> entities)
            where TEntity : class, IEntity;

        IQueryable<TEntity> Query<TEntity>()
            where TEntity : class, IEntity;

        Task<TEntity> FindAsync<TEntity>(params object[] keyValues) where TEntity : class, IEntity;

        DbContext Context { get; }
    }
}