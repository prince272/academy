using System;
using System.Threading.Tasks;

namespace Academy.Server.Extensions.CacheManager
{
    public interface ICacheManager : IDisposable
    {
        Task<T> GetAsync<T>(string key, Func<Task<T>> acquire, TimeSpan? cacheTime = null);

        Task SetAsync(string key, object data, TimeSpan? cacheTime = null);

        Task RemoveAsync(string key);

        Task RemoveByPrefixAsync(string prefix);

        Task ClearAsync();
    }
}
