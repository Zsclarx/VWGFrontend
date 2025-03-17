#include <bits/stdc++.h>
#include <ext/pb_ds/assoc_container.hpp>
#include <ext/pb_ds/tree_policy.hpp>

using namespace std;
using namespace __gnu_pbds;

#define int long long
#define endl "\n"
#define ll long long
#define forn(i, n, k) for (int i = n; i < k; i++)
#define vii vector<int>
#define pii pair<int, int>
#define mii map<int, int>
#define vvi vector<vector<int>>
#define vpi vector<pair<int, int>>
#define F first
#define S second
#define all(x) x.begin(), x.end()

typedef tree<int, null_type, less<int>, rb_tree_tag, tree_order_statistics_node_update> pbds;
typedef tree<ll, null_type, less<ll>, rb_tree_tag, tree_order_statistics_node_update> pbdsl;

const int M = 1e9 + 7;
const int p = 500000004;
int n;
string s;


void solve() {
    cin >> n;
    cin >> s;
    
    vii last(n, -1);
    int lst = -1;

    forn(i, 0, n) {
        if (s[i] == '1') {
            last[i] = lst;
        } else {
            lst = i;
        }
    }

    vvi dp(n, vii(2, -1));

    dp[0][0] = 0, dp[0][1] = 1;
    for (ll i = 1; i < n; ++i) {
        if (s[i] == '0') {
            dp[i][0] = (dp[i - 1][0] + 1) % M;
            dp[i][1] = ((dp[i - 1][0] + dp[i - 1][1]) * p + 1) % M;
        } else {
            dp[i][0] = ((dp[i - 1][0] + dp[i - 1][1]) * p + 1) % M;
            dp[i][1] = (dp[i - 1][1] + 1) % M;
        }
    }
    cout << dp[n - 1][0] << "\n";


}

signed main() {
    ios_base::sync_with_stdio(false);
    cin.tie(NULL);
    
    int t;
    cin >> t;
    while (t--) {
        solve();
    }

    return 0;
}
