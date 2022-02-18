using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Options;
using Microsoft.Extensions.Primitives;
using System;
using System.Collections.Concurrent;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;

namespace Academy.Server.Extensions.CacheManager
{
    public partial class MemoryCacheManager : ICacheManager
    {

        #region Fields

        private readonly IMemoryCache cache;
        private readonly MemoryCacheManagerOptions cacheManagerOptions;
        private bool _disposed;
        private static CancellationTokenSource _resetCacheToken = new CancellationTokenSource();

        protected static readonly ConcurrentDictionary<string, bool> _allCacheKeys;

        #endregion

        static MemoryCacheManager()
        {
            _allCacheKeys = new ConcurrentDictionary<string, bool>();
        }

        public MemoryCacheManager(IServiceProvider serviceProvider)
        {
            cache = serviceProvider.GetRequiredService<IMemoryCache>();
            cacheManagerOptions = serviceProvider.GetRequiredService<IOptions<MemoryCacheManagerOptions>>().Value;
        }

        #region Methods

        public virtual async Task<T> GetAsync<T>(string key, Func<Task<T>> acquire, TimeSpan? cacheTime = null)
        {
            return await cache.GetOrCreateAsync(key, entry =>
            {
                AddKey(key);
                entry.SetOptions(GetMemoryCacheEntryOptions(cacheTime));
                return acquire();
            });
        }

        public virtual Task SetAsync(string key, object data, TimeSpan? cacheTime = null)
        {
            if (data != null)
            {
                cache.Set(AddKey(key), data, GetMemoryCacheEntryOptions(cacheTime));
            }
            return Task.CompletedTask;
        }

        public virtual Task RemoveAsync(string key)
        {
            cache.Remove(key);

            return Task.CompletedTask;
        }

        public virtual Task RemoveByPrefixAsync(string prefix)
        {
            var keysToRemove = _allCacheKeys.Keys.Where(x => x.ToString().StartsWith(prefix, StringComparison.OrdinalIgnoreCase)).ToList();
            foreach (var key in keysToRemove)
            {
                cache.Remove(key);
            }

            return Task.CompletedTask;
        }

        public virtual Task ClearAsync()
        {
            //clear key
            ClearKeys();

            //cancel
            _resetCacheToken.Cancel();
            //dispose
            _resetCacheToken.Dispose();

            _resetCacheToken = new CancellationTokenSource();

            return Task.CompletedTask;
        }

        ~MemoryCacheManager()
        {
            Dispose(false);
        }

        public void Dispose()
        {
            Dispose(true);
            GC.SuppressFinalize(this);
        }

        protected virtual void Dispose(bool disposing)
        {
            if (!_disposed)
            {
                if (disposing)
                {
                    cache.Dispose();
                }
                _disposed = true;
            }
        }

        #endregion

        #region Utilities

        protected MemoryCacheEntryOptions GetMemoryCacheEntryOptions(TimeSpan? cacheTime)
        {
            var options = new MemoryCacheEntryOptions() { AbsoluteExpirationRelativeToNow = cacheTime ?? cacheManagerOptions.CacheTime }
                .AddExpirationToken(new CancellationChangeToken(_resetCacheToken.Token))
                .RegisterPostEvictionCallback(PostEvictionCallback);

            return options;
        }


        protected string AddKey(string key)
        {
            _allCacheKeys.TryAdd(key, true);
            return key;
        }

        protected string RemoveKey(string key)
        {
            _allCacheKeys.TryRemove(key, out _);
            return key;
        }


        private void ClearKeys()
        {
            _allCacheKeys.Clear();
        }

        private void PostEvictionCallback(object key, object value, EvictionReason reason, object state)
        {
            if (reason == EvictionReason.Replaced)
                return;

            if (reason == EvictionReason.TokenExpired)
                return;

            RemoveKey(key.ToString());
        }

        #endregion

    }
}
